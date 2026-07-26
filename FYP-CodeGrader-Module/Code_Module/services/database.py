from sqlalchemy import create_engine, Column, String, Integer, Float, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from dotenv import load_dotenv
import uuid
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set. Please add it to your .env file.\n"
        "Example: DATABASE_URL=postgresql://postgres:your_password@localhost:5432/fyp_grader"
    )

engine = create_engine(DATABASE_URL)
 
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
 
 
# ── Users ─────────────────────────────────────────────────────────────────────
 
class User(Base):
    __tablename__ = "users"
 
    id             = Column(Integer, primary_key=True, autoincrement=True)
    name           = Column(String, nullable=False)
    email          = Column(String, nullable=False, unique=True)
    password       = Column(String, nullable=False)
    role           = Column(String, nullable=False)
    department     = Column(String, nullable=True)
    specialization = Column(String, nullable=True)
    matric_number  = Column(String, nullable=True)
    created_at     = Column(DateTime, default=datetime.utcnow)
 
 
# ── Courses ───────────────────────────────────────────────────────────────────
 
class Course(Base):
    __tablename__ = "courses"
 
    id                  = Column(Integer, primary_key=True, autoincrement=True)
    code                = Column(String, nullable=False)
    title               = Column(String, nullable=False)
    description         = Column(String, nullable=True)
    assigned_teacher_id = Column(Integer, nullable=True)
    credit_hours        = Column(Integer, default=3)
    semester            = Column(String, nullable=True)
    capacity            = Column(Integer, default=30)
    created_at          = Column(DateTime, default=datetime.utcnow)
 
 
# ── Enrollments ───────────────────────────────────────────────────────────────
 
class Enrollment(Base):
    __tablename__ = "enrollments"
 
    id         = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, nullable=False)
    course_id  = Column(Integer, nullable=False)
 
 
# ── Weeks ─────────────────────────────────────────────────────────────────────
 
class Week(Base):
    __tablename__ = "weeks"
 
    id         = Column(Integer, primary_key=True, autoincrement=True)
    course_id  = Column(Integer, nullable=False)
    number     = Column(Integer, nullable=False)
    title      = Column(String, nullable=False)
    start_date = Column(String, nullable=True)
    lessons    = Column(Text, nullable=True)
 
 
# ── Week Materials ────────────────────────────────────────────────────────────
# Stores study materials (files and video links) attached to a week.
# type  = "file" or "video"
# name  = display name shown in the UI
# url   = file path (for files) or YouTube embed URL (for videos)
 
class WeekMaterial(Base):
    __tablename__ = "week_materials"
 
    id         = Column(Integer, primary_key=True, autoincrement=True)
    week_id    = Column(Integer, nullable=False)
    type       = Column(String, nullable=False)
    name       = Column(String, nullable=False)
    url        = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
 
 
# ── Assignments ───────────────────────────────────────────────────────────────
 
class Assignment(Base):
    __tablename__ = "assignments"
 
    id              = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title           = Column(String, nullable=False)
    description     = Column(Text, nullable=False)
    topic           = Column(String, nullable=False)
    language        = Column(String, nullable=False)
    sample_solution = Column(Text, nullable=True)
    num_test_cases  = Column(Integer, default=5)
    test_cases      = Column(Text, nullable=True)
    status          = Column(String, default="pending")
    created_at      = Column(DateTime, default=datetime.utcnow)
    course_id       = Column(Integer, nullable=True)
    week_id         = Column(Integer, nullable=True)
    due_date        = Column(String, nullable=True)
    file_path       = Column(String, nullable=True)
    assignment_type = Column(String, default="code")   # code, document, handwritten
 
    # Professor sets this when creating the assignment.
    # Example: a 40-mark assignment → total_marks = 40.
    # This is used to calculate the standardized score out of 10.
    # Default is 100 so old assignments without this field still work correctly.
    total_marks     = Column(Float, default=100.0, nullable=True)
 
 
# ── Submissions ───────────────────────────────────────────────────────────────
 
class Submission(Base):
    __tablename__ = "submissions"
 
    id                 = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id         = Column(String, nullable=False)
    assignment_id      = Column(String, nullable=True)
    problem_id         = Column(String, nullable=False)
    language           = Column(String, nullable=False)
    source_code        = Column(Text, nullable=True)
    score              = Column(Integer, default=0)       # raw score the AI gives (0-100 scale)
    passed             = Column(Integer, default=0)       # test cases passed (code only)
    total              = Column(Integer, default=0)       # total test cases (code only)
    test_results       = Column(Text, nullable=True)
    status             = Column(String, default="pending")
    ai_feedback        = Column(Text, nullable=True)
    submitted_at       = Column(DateTime, default=datetime.utcnow)
    submission_type    = Column(String, default="code")   # code, document, handwritten
    file_path          = Column(String, nullable=True)
 
    # Standardized score out of 10.
    # Formula: (obtained_marks / total_marks) * 10, rounded to 1 decimal.
    # Example: student got 34 out of 40 → (34/40)*10 = 8.5
    # This is calculated in the celery worker after grading and saved here.
    standardized_score = Column(Float, nullable=True)
 
 
# ── DB Setup ──────────────────────────────────────────────────────────────────
 
def create_tables():
    # Creates all tables that do not exist yet — safe to call on every startup.
    # For new columns on existing tables, run the ALTER TABLE commands in pgAdmin:
    #   ALTER TABLE assignments ADD COLUMN IF NOT EXISTS total_marks FLOAT DEFAULT 100;
    #   ALTER TABLE submissions ADD COLUMN IF NOT EXISTS standardized_score FLOAT;
    Base.metadata.create_all(bind=engine)
 
 
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()