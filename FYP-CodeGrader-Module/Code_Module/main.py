from dotenv import load_dotenv
load_dotenv()

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, Form, File, UploadFile, Path, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, field_validator
from typing import List, Optional
from sqlalchemy.orm import Session
from services.database import (
    get_db, create_tables,
    Submission, Assignment,
    User, Course, Enrollment, Week,
    WeekMaterial,
)
from services.celery_worker  import evaluate_code, evaluate_document, evaluate_handwritten
from services.ai_service     import generate_test_cases
from services.email_service  import send_assignment_notification, send_material_notification
from services.scheduler      import start_scheduler

import json, os, shutil, uuid, bcrypt
from datetime import datetime, timedelta
from jose import jwt, JWTError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials


# ── Password Helpers ──────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    """Converts a plain text password into a bcrypt hash."""
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    # Support both plain text (seeded data) and bcrypt hashed passwords
    if hashed.startswith("$2b$") or hashed.startswith("$2a$"):
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    return plain == hashed


# ── JWT Helpers ───────────────────────────────────────────────────────────────

JWT_SECRET    = os.getenv("JWT_SECRET", "fallback-secret-change-this")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24

bearer_scheme = HTTPBearer()

def create_token(user_id: int, role: str) -> str:
    """Generates a JWT token for the user after login."""
    payload = {
        "sub":  str(user_id),
        "role": role,
        "exp":  datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    """Decodes the token to extract user information — returns an error if the token is invalid."""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token. Please login again.")

# ── Auth Dependencies — use these in endpoints using Depends() ────────────

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    """Any logged-in user — only a valid token is required."""
    return decode_token(credentials.credentials)

def require_admin(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    """Only users with the admin role can access it."""
    payload = decode_token(credentials.credentials)
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")
    return payload

def require_teacher(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    """Only users with the teacher role can access it."""
    payload = decode_token(credentials.credentials)
    if payload.get("role") != "teacher":
        raise HTTPException(status_code=403, detail="Teacher access required.")
    return payload

def require_admin_or_teacher(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    """Both admin and teacher roles can access it."""
    payload = decode_token(credentials.credentials)
    if payload.get("role") not in ("admin", "teacher"):
        raise HTTPException(status_code=403, detail="Teacher or Admin access required.")
    return payload

create_tables()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ── Lifespan — runs on server startup and shutdown ────────────────────────────
# This is the modern FastAPI way to run startup logic.
# @app.on_event("startup") is deprecated — lifespan replaces it.

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start the daily reminder scheduler when the server starts
    scheduler = start_scheduler()
    yield
    # Shut the scheduler down cleanly when the server stops
    scheduler.shutdown(wait=False)
    print("[Scheduler] Stopped.")


app = FastAPI(
    title       = "Assess.io",
    description = "Assess.io — The Multi-Modal Assignment Grading System",
    version     = "2.0.0",
    lifespan    = lifespan,
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"] + [
    o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()
    ],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)


# ── Request Models ────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email:    str
    password: str
    role:     Optional[str] = None


class SubmissionRequest(BaseModel):
    student_id:    str
    assignment_id: str
    language:      str
    source_code:   str

    @field_validator("language")
    def validate_language(cls, v):
        if v not in ["python", "cpp"]:
            raise ValueError("Only 'python' and 'cpp' are supported")
        return v

    @field_validator("source_code")
    def validate_source_code(cls, v):
        if len(v) == 0:
            raise ValueError("Source code cannot be empty")
        if len(v) > 50000:
            raise ValueError("Source code too large (max 50KB)")
        return v

    @field_validator("student_id")
    def validate_student_id(cls, v):
        if not v.strip():
            raise ValueError("Student ID cannot be empty")
        return v.strip()


class TestCaseRequest(BaseModel):
    title:           str
    description:     str
    topic:           str
    language:        str
    sample_solution: str = ""
    num_test_cases:  int = 5


# ── Home ──────────────────────────────────────────────────────────────────────

@app.get("/")
def home():
    return {
        "message": "AI Code Evaluator v2.0 is running!",
        "endpoints": [
            "/auth/login", "/courses",
            "/courses/teacher/{teacher_id}", "/courses/student/{student_id}",
            "/courses/{course_id}", "/courses/{course_id}/weeks",
            "/weeks/{week_id}",
            "/weeks/{week_id}/materials",
            "/materials/{material_id}",
            "/generate-test-cases",
            "/assignment/create", "/assignment/{id}", "/assignments",
            "/submit", "/submit/document", "/submit/handwritten",
            "/result/{id}",
            "/history/{student_id}", "/submissions/teacher/{teacher_id}",
        ]
    }


# ── Auth ──────────────────────────────────────────────────────────────────────

@app.post("/auth/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    # First, find the user by email, then verify the password
    user = db.query(User).filter(User.email == request.email).first()

    if not user or not verify_password(request.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(user.id, user.role)

    return {
        "token":          token,
        "id":             user.id,
        "name":           user.name,
        "email":          user.email,
        "role":           user.role,
        "department":     user.department,
        "specialization": user.specialization,
        "matric_number":  user.matric_number,
    }



# ── Helper Functions ──────────────────────────────────────────────────────────

def _course_dict(c):
    return {
        "id": c.id, "code": c.code, "title": c.title,
        "description": c.description, "assigned_teacher_id": c.assigned_teacher_id,
        "credit_hours": c.credit_hours, "semester": c.semester, "capacity": c.capacity,
    }

def _week_dict(w):
    return {
        "id": w.id, "course_id": w.course_id, "number": w.number,
        "title": w.title, "start_date": w.start_date,
        "lessons": json.loads(w.lessons) if w.lessons else [],
    }

def _user_dict(u):
    return {
        "id": u.id, "name": u.name, "email": u.email, "role": u.role,
        "department": u.department, "specialization": u.specialization,
        "matric_number": u.matric_number, "created_at": u.created_at,
    }

def _material_dict(m):
    return {
        "id":         m.id,
        "week_id":    m.week_id,
        "type":       m.type,
        "name":       m.name,
        "url":        m.url,
        "created_at": m.created_at.isoformat() if m.created_at else None,
    }

def _get_enrolled_students(course_id, db):
    """
    Helper used by email notifications — returns all Student User objects
    enrolled in the given course. Reused in both assignment and material endpoints.
    """
    enrollments = db.query(Enrollment).filter(Enrollment.course_id == course_id).all()
    student_ids = [e.student_id for e in enrollments]
    return db.query(User).filter(User.id.in_(student_ids)).all()


# ── Course Endpoints ──────────────────────────────────────────────────────────

@app.get("/courses")
def get_all_courses(db: Session = Depends(get_db)):
    return [_course_dict(c) for c in db.query(Course).all()]


@app.get("/courses/teacher/{teacher_id}")
def get_teacher_courses(teacher_id: int, db: Session = Depends(get_db)):
    courses = db.query(Course).filter(Course.assigned_teacher_id == teacher_id).all()
    result = []
    for c in courses:
        enrolled_count = db.query(Enrollment).filter(Enrollment.course_id == c.id).count()
        d = _course_dict(c)
        d["enrolled_count"] = enrolled_count
        result.append(d)
    return result


@app.get("/courses/student/{student_id}")
def get_student_courses(student_id: int, db: Session = Depends(get_db)):
    enrollments = db.query(Enrollment).filter(Enrollment.student_id == student_id).all()
    course_ids  = [e.course_id for e in enrollments]
    courses     = db.query(Course).filter(Course.id.in_(course_ids)).all()

    result = []
    for c in courses:
        week_count       = db.query(Week).filter(Week.course_id == c.id).count()
        assignment_count = db.query(Assignment).filter(Assignment.course_id == c.id).count()

        # Assignments that are in this course
        course_assignment_ids = [
            a.id for a in db.query(Assignment).filter(
                Assignment.course_id == c.id,
                Assignment.status == "ready"
            ).all()
        ]

        # How many did the student submitted
        submitted_ids = [
            s.assignment_id for s in db.query(Submission).filter(
                Submission.student_id == str(student_id),
                Submission.assignment_id.in_(course_assignment_ids)
            ).all()
        ]

        pending_count = len([a for a in course_assignment_ids if a not in submitted_ids])

        # Grading status — any assignment in processing?
        processing = db.query(Submission).filter(
            Submission.student_id == str(student_id),
            Submission.assignment_id.in_(course_assignment_ids),
            Submission.status.in_(["pending", "processing"])
        ).first()

        d = _course_dict(c)
        d['week_count']       = week_count
        d['assignment_count'] = assignment_count
        d['pending_count']    = pending_count
        d['grading_status']   = 'processing' if processing else 'up_to_date'
        result.append(d)
    return result


@app.get("/courses/{course_id}/weeks")
def get_course_weeks(course_id: int, db: Session = Depends(get_db)):
    weeks = db.query(Week).filter(Week.course_id == course_id).order_by(Week.number).all()
    return [_week_dict(w) for w in weeks]


@app.get("/courses/{course_id}")
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return _course_dict(course)


@app.get("/weeks/{week_id}")
def get_week(week_id: int, db: Session = Depends(get_db)):
    week = db.query(Week).filter(Week.id == week_id).first()
    if not week:
        raise HTTPException(status_code=404, detail="Week not found")
    return _week_dict(week)


class WeekCreate(BaseModel):
    number:     int
    title:      str
    start_date: Optional[str]       = None
    lessons:    Optional[List[str]] = []

@app.post("/courses/{course_id}/weeks")
def create_week(course_id: int, payload: WeekCreate, db: Session = Depends(get_db), _: dict = Depends(require_admin_or_teacher)):
    week = Week(
        course_id  = course_id,
        number     = payload.number,
        title      = payload.title,
        start_date = payload.start_date,
        lessons    = json.dumps(payload.lessons),
    )
    db.add(week)
    db.commit()
    db.refresh(week)
    return _week_dict(week)

class WeekUpdate(BaseModel):
    title:      Optional[str] = None
    start_date: Optional[str] = None

@app.put("/weeks/{week_id}")
def update_week(week_id: int, payload: WeekUpdate, db: Session = Depends(get_db), _: dict = Depends(require_admin_or_teacher)):
    week = db.query(Week).filter(Week.id == week_id).first()
    if not week:
        raise HTTPException(status_code=404, detail="Week not found")
    if payload.title is not None:      week.title      = payload.title
    if payload.start_date is not None: week.start_date = payload.start_date
    db.commit()
    db.refresh(week)
    return _week_dict(week)

@app.delete("/weeks/{week_id}")
def delete_week(week_id: int, db: Session = Depends(get_db), _: dict = Depends(require_admin_or_teacher)):
    week = db.query(Week).filter(Week.id == week_id).first()
    if not week:
        raise HTTPException(status_code=404, detail="Week not found")
    db.query(WeekMaterial).filter(WeekMaterial.week_id == week_id).delete()
    db.delete(week)
    db.commit()
    return {"message": f"Week {week_id} deleted successfully"}


# ── Week Materials Endpoints ──────────────────────────────────────────────────

@app.get("/weeks/{week_id}/materials")
def get_week_materials(week_id: int, db: Session = Depends(get_db)):
    materials = (
        db.query(WeekMaterial)
        .filter(WeekMaterial.week_id == week_id)
        .order_by(WeekMaterial.created_at)
        .all()
    )
    return [_material_dict(m) for m in materials]


@app.post("/weeks/{week_id}/materials", status_code=201)
async def add_week_material(
    week_id:          int,
    background_tasks: BackgroundTasks,
    type:             str        = Form(...),
    name:             str        = Form(...),
    file:             UploadFile = File(None),
    url:              str        = Form(None),
    db:               Session    = Depends(get_db),
    _:                dict       = Depends(require_admin_or_teacher),
):
    week = db.query(Week).filter(Week.id == week_id).first()
    if not week:
        raise HTTPException(status_code=404, detail="Week not found")

    if type == "file":
        if not file or not file.filename:
            raise HTTPException(status_code=400, detail="A file is required for type=file")
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in [".pdf", ".ppt", ".pptx", ".doc", ".docx"]:
            raise HTTPException(status_code=400, detail="Only PDF, PPT, or Word files are allowed")
        unique_filename = f"{uuid.uuid4()}{ext}"
        file_location   = os.path.join(UPLOAD_DIR, unique_filename)
        with open(file_location, "wb") as f:
            shutil.copyfileobj(file.file, f)
        saved_url = f"/uploads/{unique_filename}"

    elif type == "video":
        if not url or not url.strip():
            raise HTTPException(status_code=400, detail="A URL is required for type=video")
        saved_url = url.strip()

    else:
        raise HTTPException(status_code=400, detail="type must be 'file' or 'video'")

    material = WeekMaterial(
        week_id = week_id,
        type    = type,
        name    = name.strip(),
        url     = saved_url,
    )
    db.add(material)
    db.commit()
    db.refresh(material)

    # Notify all students enrolled in this course in the background.
    # Background task runs AFTER the response is sent — professor sees success instantly.
    course   = db.query(Course).filter(Course.id == week.course_id).first()
    students = _get_enrolled_students(week.course_id, db)

    for student in students:
        background_tasks.add_task(
            send_material_notification,
            student_email = student.email,
            student_name  = student.name,
            course_title  = course.title if course else "",
            course_code   = course.code  if course else "",
            week_title    = week.title,
            material_name = name.strip(),
            material_type = type,
        )

    return _material_dict(material)


@app.delete("/materials/{material_id}")
def delete_week_material(material_id: int, db: Session = Depends(get_db), _: dict = Depends(require_admin_or_teacher)):
    material = db.query(WeekMaterial).filter(WeekMaterial.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    if material.type == "file":
        file_path = os.path.join(UPLOAD_DIR, os.path.basename(material.url))
        if os.path.exists(file_path):
            os.remove(file_path)

    db.delete(material)
    db.commit()
    return {"message": f"Material {material_id} deleted successfully"}


# ── Extract Assignment File Endpoint ──────────────────────────────────────────

@app.post("/extract-assignment-file")
async def extract_assignment_file(
    file: UploadFile = File(...),
    _:    dict       = Depends(require_admin_or_teacher),
):
    import pdfplumber
    from docx import Document as DocxDocument
    from groq import Groq
    import io, re

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".pdf", ".docx", ".doc"]:
        raise HTTPException(status_code=400, detail="Only PDF or DOCX files are supported")

    file_bytes = await file.read()

    extracted_text = ""
    try:
        if ext == ".pdf":
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        extracted_text += page_text + "\n"
        else:
            doc = DocxDocument(io.BytesIO(file_bytes))
            for para in doc.paragraphs:
                if para.text.strip():
                    extracted_text += para.text + "\n"
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract text: {str(e)}")

    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract any text from the file. Make sure it is not a scanned image.")

    extracted_text = extracted_text[:4000]

    try:
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))

        prompt = f"""You are helping a teacher set up an assignment on an AI grading platform.
Below is the content extracted from an assignment file uploaded by the teacher.

ASSIGNMENT CONTENT:
{extracted_text}

Based on this content, write a clear and detailed assignment description that explains:
- What the assignment is about
- What the student is expected to do or produce
- Any specific requirements, constraints, or tasks mentioned

Keep it concise but complete. Write it as instructions directed at the student.

Respond in this exact JSON format:
{{
  "description": "..."
}}

Only respond with valid JSON. No extra text or markdown."""

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=800,
            temperature=0.3,
        )

        raw = response.choices[0].message.content.strip()
        json_match = re.search(r'\{.*\}', raw, re.DOTALL)
        if not json_match:
            raise ValueError("No JSON in response")
        result = json.loads(json_match.group())

        return {
            "description": result.get("description", ""),
            "extracted_chars": len(extracted_text),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")


# ── Generate Test Cases Endpoint ──────────────────────────────────────────────

@app.post("/generate-test-cases")
def generate_test_cases_endpoint(payload: TestCaseRequest, _: dict = Depends(require_admin_or_teacher)):
    try:
        test_cases = generate_test_cases(
            title           = payload.title,
            description     = payload.description,
            topic           = payload.topic,
            language        = payload.language,
            sample_solution = payload.sample_solution,
            num_test_cases  = payload.num_test_cases,
        )
        return {"test_cases": test_cases}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Assignment Endpoints ──────────────────────────────────────────────────────

@app.get("/assignments")
def get_assignments(
    course_id: Optional[int] = None,
    week_id:   Optional[int] = None,
    db:        Session        = Depends(get_db)
):
    query = db.query(Assignment)
    if course_id is not None:
        query = query.filter(Assignment.course_id == course_id)
    if week_id is not None:
        query = query.filter(Assignment.week_id == week_id)
    assignments = query.order_by(Assignment.created_at.desc()).all()

    return [
        {
            "id": a.id, "title": a.title, "description": a.description,
            "topic": a.topic, "language": a.language,
            "assignment_type": a.assignment_type, "status": a.status,
            "course_id": a.course_id, "week_id": a.week_id,
            "due_date": a.due_date, "file_path": a.file_path,
            "num_test_cases": a.num_test_cases,
            "total_marks": a.total_marks,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in assignments
    ]


@app.get("/assignment/{assignment_id}")
def get_assignment(assignment_id: str, db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return {
        "id": assignment.id, "title": assignment.title,
        "description": assignment.description, "topic": assignment.topic,
        "language": assignment.language, "assignment_type": assignment.assignment_type,
        "status": assignment.status, "course_id": assignment.course_id,
        "week_id": assignment.week_id, "due_date": assignment.due_date,
        "file_path": assignment.file_path, "num_test_cases": assignment.num_test_cases,
        "total_marks": assignment.total_marks,
        "test_cases": json.loads(assignment.test_cases) if assignment.test_cases else [],
        "created_at": assignment.created_at.isoformat() if assignment.created_at else None,
    }


@app.put("/assignment/{assignment_id}")
async def update_assignment(
    assignment_id:   str            = Path(...),
    title:           Optional[str]  = Form(None),
    description:     Optional[str]  = Form(None),
    topic:           Optional[str]  = Form(None),
    language:        Optional[str]  = Form(None),
    due_date:        Optional[str]  = Form(None),
    status:          Optional[str]  = Form(None),
    sample_solution: Optional[str]  = Form(None),
    test_cases:      Optional[str]  = Form(None),
    total_marks:     Optional[float]= Form(None),
    db:              Session        = Depends(get_db),
    _:               dict           = Depends(require_admin_or_teacher),
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if title is not None:           assignment.title = title
    if description is not None:     assignment.description = description
    if topic is not None:           assignment.topic = topic
    if language is not None:        assignment.language = language
    if due_date is not None:        assignment.due_date = due_date
    if status is not None:          assignment.status = status
    if sample_solution is not None: assignment.sample_solution = sample_solution
    if total_marks is not None:     assignment.total_marks = total_marks
    if test_cases is not None:
        try:
            parsed = json.loads(test_cases)
            assignment.test_cases     = json.dumps(parsed)
            assignment.num_test_cases = len(parsed)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid test_cases format")

    db.commit()
    db.refresh(assignment)
    return {"message": "Assignment updated successfully", "assignment_id": assignment.id}


@app.delete("/assignment/{assignment_id}")
def delete_assignment(assignment_id: str, db: Session = Depends(get_db), _: dict = Depends(require_admin_or_teacher)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    existing = db.query(Submission).filter(
        Submission.assignment_id == assignment_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete this assignment because students have already submitted."
        )

    db.delete(assignment)
    db.commit()
    return {"message": "Assignment deleted successfully"}


@app.post("/assignment/create", status_code=201)
async def create_assignment(
    background_tasks: BackgroundTasks,
    title:            str        = Form(...),
    description:      str        = Form(...),
    topic:            str        = Form(...),
    language:         str        = Form(...),
    assignment_type:  str        = Form("code"),
    sample_solution:  str        = Form(""),
    num_test_cases:   int        = Form(5),
    test_cases:       str        = Form("[]"),
    course_id:        Optional[int] = Form(None),
    week_id:          Optional[int] = Form(None),
    due_date:         Optional[str] = Form(None),
    total_marks:      float      = Form(100.0),
    file:             UploadFile = File(None),
    db:               Session    = Depends(get_db),
    _:                dict       = Depends(require_admin_or_teacher),
):
    if not title.strip() or not description.strip():
        raise HTTPException(status_code=400, detail="Title and description are required")

    if assignment_type == "code" and language not in ["python", "cpp"]:
        raise HTTPException(status_code=400, detail="Only 'python' and 'cpp' are supported for code assignments")

    if total_marks is None or total_marks <= 0:
        raise HTTPException(status_code=400, detail="Total marks must be a positive number")

    # Save the uploaded instructions file if one was provided
    file_path = None
    if file and file.filename:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in [".pdf", ".docx", ".doc"]:
            raise HTTPException(status_code=400, detail="Only PDF or DOCX files allowed")
        unique_filename = f"{uuid.uuid4()}{ext}"
        file_location   = os.path.join(UPLOAD_DIR, unique_filename)
        with open(file_location, "wb") as f:
            shutil.copyfileobj(file.file, f)
        file_path = f"/uploads/{unique_filename}"

    # Helper — sends email notifications to all enrolled students after DB save
    def _notify_students(assignment_obj):
        if not course_id:
            return
        course   = db.query(Course).filter(Course.id == course_id).first()
        students = _get_enrolled_students(course_id, db)
        for student in students:
            background_tasks.add_task(
                send_assignment_notification,
                student_email    = student.email,
                student_name     = student.name,
                course_title     = course.title if course else "",
                course_code      = course.code  if course else "",
                assignment_title = assignment_obj.title,
                assignment_type  = assignment_obj.assignment_type,
                due_date         = assignment_obj.due_date,
            )

    # Document assignment
    if assignment_type == "document":
        assignment = Assignment(
            title=title, description=description, topic=topic,
            language="N/A", sample_solution=sample_solution,
            num_test_cases=0, test_cases="[]", status="ready",
            assignment_type="document", course_id=course_id,
            week_id=week_id, due_date=due_date, file_path=file_path,
            total_marks=total_marks,
        )
        db.add(assignment)
        db.commit()
        db.refresh(assignment)
        _notify_students(assignment)
        return {
            "assignment_id": assignment.id, "title": assignment.title,
            "topic": assignment.topic, "language": assignment.language,
            "assignment_type": assignment.assignment_type, "status": assignment.status,
            "due_date": assignment.due_date, "file_path": assignment.file_path,
            "total_marks": assignment.total_marks,
            "test_cases_generated": 0, "test_cases": [],
            "message": "Document assignment created successfully!"
        }

    # Handwritten assignment
    if assignment_type == "handwritten":
        assignment = Assignment(
            title=title, description=description, topic=topic,
            language="N/A", sample_solution="",
            num_test_cases=0, test_cases="[]", status="ready",
            assignment_type="handwritten", course_id=course_id,
            week_id=week_id, due_date=due_date, file_path=file_path,
            total_marks=total_marks,
        )
        db.add(assignment)
        db.commit()
        db.refresh(assignment)
        _notify_students(assignment)
        return {
            "assignment_id": assignment.id, "title": assignment.title,
            "topic": assignment.topic, "language": assignment.language,
            "assignment_type": assignment.assignment_type, "status": assignment.status,
            "due_date": assignment.due_date, "file_path": assignment.file_path,
            "total_marks": assignment.total_marks,
            "test_cases_generated": 0, "test_cases": [],
            "message": "Handwritten assignment created successfully!"
        }

    # Code assignment
    try:
        parsed_test_cases = json.loads(test_cases)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid test cases format — must be a JSON array")

    if not parsed_test_cases:
        raise HTTPException(status_code=400, detail="At least one test case is required for a code assignment")

    assignment = Assignment(
        title=title, description=description, topic=topic,
        language=language, sample_solution=sample_solution,
        num_test_cases=len(parsed_test_cases),
        test_cases=json.dumps(parsed_test_cases),
        status="ready", assignment_type="code",
        course_id=course_id, week_id=week_id,
        due_date=due_date, file_path=file_path,
        total_marks=total_marks,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    _notify_students(assignment)

    return {
        "assignment_id": assignment.id, "title": assignment.title,
        "topic": assignment.topic, "language": assignment.language,
        "assignment_type": assignment.assignment_type, "status": assignment.status,
        "due_date": assignment.due_date, "file_path": assignment.file_path,
        "total_marks": assignment.total_marks,
        "test_cases_generated": len(parsed_test_cases),
        "test_cases": parsed_test_cases,
        "message": f"Assignment created with {len(parsed_test_cases)} test cases."
    }


# ── Submission Endpoints ──────────────────────────────────────────────────────

@app.post("/submit", status_code=201)
def submit_code(request: SubmissionRequest, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    assignment = db.query(Assignment).filter(Assignment.id == request.assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail=f"Assignment '{request.assignment_id}' not found")
    if assignment.status != "ready":
        raise HTTPException(status_code=400, detail="Assignment test cases not ready yet")

    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == int(current_user["sub"]),
        Enrollment.course_id == assignment.course_id
    ).first()
    if not enrollment:
        raise HTTPException(status_code=403, detail="You are not enrolled in this course")
    
    existing = db.query(Submission).filter(
    Submission.student_id == request.student_id,
    Submission.assignment_id == request.assignment_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already submitted this assignment")

    submission = Submission(
        student_id=request.student_id, assignment_id=request.assignment_id,
        problem_id=assignment.title, language=request.language,
        source_code=request.source_code, status="pending"
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    evaluate_code.delay(submission.id)

    return {
        "submission_id": submission.id,
        "status": "pending",
        "message": "Code submitted! Processing in queue..."
    }


@app.post("/submit/document", status_code=201)
async def submit_document(
    student_id:    str        = Form(...),
    assignment_id: str        = Form(...),
    file:          UploadFile = File(...),
    db:            Session    = Depends(get_db),
    _:             dict       = Depends(get_current_user),
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".pdf", ".docx", ".doc"]:
        raise HTTPException(status_code=400, detail="Only PDF or DOCX files are allowed")

    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail=f"Assignment '{assignment_id}' not found")

    unique_filename = f"{uuid.uuid4()}{ext}"
    file_location   = os.path.join(UPLOAD_DIR, unique_filename)
    with open(file_location, "wb") as f:
        shutil.copyfileobj(file.file, f)

    submission = Submission(
        student_id=student_id, assignment_id=assignment_id,
        problem_id=assignment.title, language="N/A",
        source_code=None, status="pending",
        submission_type="document", file_path=file_location,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    evaluate_document.delay(submission.id)

    return {
        "submission_id": submission.id,
        "status": "pending",
        "message": "Document submitted! Processing in queue..."
    }


@app.post("/submit/handwritten", status_code=201)
async def submit_handwritten(
    student_id:    str        = Form(...),
    assignment_id: str        = Form(...),
    file:          UploadFile = File(...),
    db:            Session    = Depends(get_db),
    _:             dict       = Depends(get_current_user),
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".pdf", ".jpg", ".jpeg", ".png"]:
        raise HTTPException(status_code=400, detail="Only PDF, JPG, or PNG files are allowed")

    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail=f"Assignment '{assignment_id}' not found")

    unique_filename = f"{uuid.uuid4()}{ext}"
    file_location   = os.path.join(UPLOAD_DIR, unique_filename)
    with open(file_location, "wb") as f:
        shutil.copyfileobj(file.file, f)

    submission = Submission(
        student_id=student_id, assignment_id=assignment_id,
        problem_id=assignment.title, language="N/A",
        source_code=None, status="pending",
        submission_type="handwritten", file_path=file_location,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    evaluate_handwritten.delay(submission.id)

    return {
        "submission_id": submission.id,
        "status": "pending",
        "message": "Handwritten assignment submitted! Processing in queue..."
    }


@app.get("/result/{submission_id}")
def get_result(submission_id: str, db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail=f"Submission '{submission_id}' not found")

    if submission.status in ["pending", "processing"]:
        return {"submission_id": submission.id, "status": submission.status, "message": "Still processing..."}

    if submission.status == "error":
        return {"submission_id": submission.id, "status": "error", "message": "Evaluation failed. Please resubmit."}

    return {
        "submission_id":      submission.id,
        "student_id":         submission.student_id,
        "assignment_id":      submission.assignment_id,
        "submission_type":    submission.submission_type,
        "problem_id":         submission.problem_id,
        "language":           submission.language,
        "score":              submission.score,
        "standardized_score": submission.standardized_score,
        "passed":             submission.passed,
        "total":              submission.total,
        "status":             submission.status,
        "source_code":        submission.source_code,
        "test_results":       json.loads(submission.test_results) if submission.test_results else [],
        "ai_feedback":        json.loads(submission.ai_feedback) if submission.ai_feedback else None,
        "submitted_at":       submission.submitted_at,
    }


@app.get("/history/{student_id}")
def get_history(student_id: str, db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    if not student_id.strip():
        raise HTTPException(status_code=400, detail="Student ID cannot be empty")

    submissions = db.query(Submission).filter(
        Submission.student_id == student_id
    ).order_by(Submission.submitted_at.desc()).all()

    return [
        {
            "submission_id":      s.id,
            "problem_id":         s.problem_id,
            "assignment_id":      s.assignment_id,
            "language":           s.language,
            "score":              s.score,
            "standardized_score": s.standardized_score,
            "passed":             s.passed,
            "total":              s.total,
            "status":             s.status,
            "source_code":        s.source_code,
            "submission_type":    s.submission_type,
            "ai_feedback":        json.loads(s.ai_feedback) if s.ai_feedback else None,
            "submitted_at":       s.submitted_at,
        }
        for s in submissions
    ]


@app.get("/submissions/teacher/{teacher_id}")
def get_teacher_submissions(teacher_id: int, db: Session = Depends(get_db), _: dict = Depends(require_admin_or_teacher)):
    courses     = db.query(Course).filter(Course.assigned_teacher_id == teacher_id).all()
    course_map  = {c.id: c for c in courses}
    course_ids  = list(course_map.keys())

    assignments    = db.query(Assignment).filter(Assignment.course_id.in_(course_ids)).all()
    assignment_map = {a.id: a for a in assignments}
    assignment_ids = list(assignment_map.keys())

    if not assignment_ids:
        return []

    submissions = db.query(Submission).filter(
        Submission.assignment_id.in_(assignment_ids)
    ).order_by(Submission.submitted_at.desc()).all()

    student_ids = list({int(s.student_id) for s in submissions if s.student_id.isdigit()})
    students    = db.query(User).filter(User.id.in_(student_ids)).all()
    student_map = {str(u.id): u for u in students}

    result = []
    for s in submissions:
        assignment = assignment_map.get(s.assignment_id)
        course     = course_map.get(assignment.course_id) if assignment else None
        student    = student_map.get(s.student_id)
        result.append({
            "submission_id":      str(s.id),
            "submission_type":    s.submission_type,
            "student_id":         s.student_id,
            "student_name":       student.name          if student    else "Unknown",
            "student_matric":     student.matric_number if student    else "—",
            "assignment_id":      s.assignment_id,
            "assignment_title":   assignment.title       if assignment else "Unknown",
            "course_id":          course.id              if course     else None,
            "course_code":        course.code            if course     else "—",
            "course_title":       course.title           if course     else "—",
            "language":           s.language,
            "score":              s.score,
            "standardized_score": s.standardized_score,
            "passed":             s.passed,
            "total":              s.total,
            "status":             s.status,
            "submitted_at":       s.submitted_at,
        })
    return result


# ── Admin Endpoints ───────────────────────────────────────────────────────────

@app.get("/admin/stats")
def get_admin_stats(db: Session = Depends(get_db), _: dict = Depends(require_admin)):
    total_users       = db.query(User).count()
    total_students    = db.query(User).filter(User.role == "student").count()
    total_teachers    = db.query(User).filter(User.role == "teacher").count()
    total_admins      = db.query(User).filter(User.role == "admin").count()
    total_courses     = db.query(Course).count()
    total_enrollments = db.query(Enrollment).count()
    avg = round(total_enrollments / total_courses, 1) if total_courses > 0 else 0

    return {
        "total_users": total_users, "total_students": total_students,
        "total_teachers": total_teachers, "total_admins": total_admins,
        "total_courses": total_courses, "total_enrollments": total_enrollments,
        "avg_students_per_course": avg,
    }


@app.get("/users")
def get_all_users(db: Session = Depends(get_db), _: dict = Depends(require_admin)):
    return [_user_dict(u) for u in db.query(User).order_by(User.id).all()]


@app.post("/users", status_code=201)
def create_user(payload: dict, db: Session = Depends(get_db), _: dict = Depends(require_admin)):
    existing = db.query(User).filter(User.email == payload.get("email")).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    password = payload.get("password", "")
    if not password or len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    user = User(
        name=payload.get("name"), email=payload.get("email"),
        password=hash_password(payload.get("password", "")),
        role=payload.get("role", "student"),
        department=payload.get("department"), specialization=payload.get("specialization"),
        matric_number=payload.get("matric_number"),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _user_dict(user)


@app.put("/users/{user_id}")
def update_user(user_id: int, payload: dict, db: Session = Depends(get_db), _: dict = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.name           = payload.get("name",           user.name)
    user.email          = payload.get("email",          user.email)
    user.role           = payload.get("role",           user.role)
    user.department     = payload.get("department",     user.department)
    user.specialization = payload.get("specialization", user.specialization)
    user.matric_number  = payload.get("matric_number",  user.matric_number)
    if payload.get("password"):
        user.password = hash_password(payload.get("password"))
    db.commit()
    db.refresh(user)
    return _user_dict(user)


@app.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), _: dict = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": f"User {user_id} deleted successfully"}


@app.post("/courses", status_code=201)
def create_course(payload: dict, db: Session = Depends(get_db), _: dict = Depends(require_admin)):
    course = Course(
        code=payload.get("code"), title=payload.get("title"),
        description=payload.get("description"),
        assigned_teacher_id=payload.get("assigned_teacher_id"),
        credit_hours=payload.get("credit_hours", 3),
        semester=payload.get("semester", "Spring 2026"),
        capacity=payload.get("capacity", 30),
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return _course_dict(course)


@app.put("/courses/{course_id}")
def update_course(course_id: int, payload: dict, db: Session = Depends(get_db), _: dict = Depends(require_admin)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    course.code                = payload.get("code",                course.code)
    course.title               = payload.get("title",               course.title)
    course.description         = payload.get("description",         course.description)
    course.assigned_teacher_id = payload.get("assigned_teacher_id", course.assigned_teacher_id)
    course.credit_hours        = payload.get("credit_hours",        course.credit_hours)
    course.semester            = payload.get("semester",            course.semester)
    course.capacity            = payload.get("capacity",            course.capacity)
    db.commit()
    db.refresh(course)
    return _course_dict(course)


@app.delete("/courses/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db), _: dict = Depends(require_admin)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(course)
    db.commit()
    return {"message": f"Course {course_id} deleted successfully"}


@app.post("/enrollments", status_code=201)
def create_enrollment(payload: dict, db: Session = Depends(get_db), _: dict = Depends(require_admin)):
    existing = db.query(Enrollment).filter(
        Enrollment.student_id == payload.get("student_id"),
        Enrollment.course_id  == payload.get("course_id")
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student already enrolled in this course")
    enrollment = Enrollment(
        student_id=payload.get("student_id"),
        course_id=payload.get("course_id"),
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return {"id": enrollment.id, "student_id": enrollment.student_id, "course_id": enrollment.course_id}


@app.delete("/enrollments/{student_id}/{course_id}")
def delete_enrollment(student_id: int, course_id: int, db: Session = Depends(get_db), _: dict = Depends(require_admin)):
    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == student_id,
        Enrollment.course_id  == course_id
    ).first()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    db.delete(enrollment)
    db.commit()
    return {"message": "Enrollment removed successfully"}


@app.get("/enrollments/course/{course_id}")
def get_course_enrollments(course_id: int, db: Session = Depends(get_db), _: dict = Depends(require_admin_or_teacher)):
    enrollments = db.query(Enrollment).filter(Enrollment.course_id == course_id).all()
    student_ids = [e.student_id for e in enrollments]
    students    = db.query(User).filter(User.id.in_(student_ids)).all()
    student_map = {u.id: u for u in students}
    return [
        {
            "enrollment_id": e.id, "student_id": e.student_id,
            "student_name":  student_map[e.student_id].name          if e.student_id in student_map else "Unknown",
            "matric_number": student_map[e.student_id].matric_number if e.student_id in student_map else None,
            "course_id":     e.course_id,
        }
        for e in enrollments
    ]
