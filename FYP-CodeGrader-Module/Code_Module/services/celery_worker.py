from celery import Celery
import json
import sys
import os
 
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
 
from services.docker_service import run_test_cases
from services.database import SessionLocal, Submission, Assignment
from services.ai_service import analyze_code
 
celery_app = Celery(
    "evaluator",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0"
)
 
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
)
 
 
def calculate_standardized_score(raw_score, total_marks):
    """
    Convert a raw score to a score out of 10.
 
    How it works:
      - raw_score  = the score the AI gave (0 to total_marks range)
      - total_marks = the max marks the professor set for this assignment
      - Formula: (raw_score / total_marks) * 10, rounded to 1 decimal place
      - Example: raw=34, total=40 → (34/40)*10 = 8.5
 
    Falls back to treating raw_score as a percentage if total_marks is missing.
    """
    try:
        total = float(total_marks) if total_marks else 100.0
        if total <= 0:
            total = 100.0
        result = (float(raw_score) / total) * 10
        # Keep it between 0 and 10
        result = max(0.0, min(10.0, result))
        return round(result, 1)
    except Exception:
        return None
 
 
@celery_app.task(name="evaluate_code")
def evaluate_code(submission_id: str):
    db = SessionLocal()
 
    try:
        # Fetch the submission
        submission = db.query(Submission).filter(
            Submission.id == submission_id
        ).first()
 
        if not submission:
            return {"error": "Submission not found"}
 
        submission.status = "processing"
        db.commit()
 
        print(f"[WORKER] Processing: {submission_id}")
 
        # Fetch the assignment to get test cases and total_marks
        assignment = db.query(Assignment).filter(
            Assignment.id == submission.assignment_id
        ).first()
 
        if not assignment or not assignment.test_cases:
            submission.status = "error"
            db.commit()
            return {"error": "Assignment or test cases not found"}
 
        test_cases = json.loads(assignment.test_cases)
 
        print(f"[WORKER] Running {len(test_cases)} test cases...")
 
        # Run all test cases in Docker sandbox
        evaluation = run_test_cases(
            source_code=submission.source_code,
            test_cases=test_cases,
            language=submission.language
        )
 
        print(f"[WORKER] Test cases done. Score: {evaluation['score']}%")
        print(f"[WORKER] Running AI analysis...")
 
        # Get AI feedback on the code
        ai_feedback = analyze_code(
            source_code=submission.source_code,
            language=submission.language,
            test_results=evaluation["results"]
        )
 
        print(f"[WORKER] AI analysis done!")
 
        # For code assignments, score from Docker is a percentage (0-100).
        # We treat that percentage as the obtained marks out of total_marks.
        # Example: score=85%, total_marks=40 → obtained=0.85*40=34 → standardized=(34/40)*10=8.5
        raw_score   = evaluation["score"]                    # e.g. 85 (percent)
        total_marks = assignment.total_marks or 100.0
        # Convert percentage score to actual marks first, then standardize
        obtained_marks = (raw_score / 100.0) * total_marks
        std_score = calculate_standardized_score(obtained_marks, total_marks)
 
        submission.score              = raw_score
        submission.passed             = evaluation["passed"]
        submission.total              = evaluation["total"]
        submission.test_results       = json.dumps(evaluation["results"])
        submission.ai_feedback        = json.dumps(ai_feedback)
        submission.standardized_score = std_score
        submission.status             = "completed"
        db.commit()
 
        print(f"[WORKER] Done: {submission_id} | Score: {raw_score}% | Standardized: {std_score}/10")
 
        return {
            "submission_id":      submission_id,
            "score":              raw_score,
            "standardized_score": std_score,
            "status":             "completed"
        }
 
    except Exception as e:
        submission = db.query(Submission).filter(
            Submission.id == submission_id
        ).first()
        if submission:
            submission.status = "error"
            db.commit()
        print(f"[WORKER] Error: {str(e)}")
        return {"error": str(e)}
 
    finally:
        db.close()
 
 
@celery_app.task(name="evaluate_document")
def evaluate_document(submission_id: str):
    db = SessionLocal()
 
    try:
        submission = db.query(Submission).filter(
            Submission.id == submission_id
        ).first()
 
        if not submission:
            return {"error": "Submission not found"}
 
        submission.status = "processing"
        db.commit()
 
        print(f"[DOC WORKER] Processing: {submission_id}")
 
        # Fetch assignment to get description and total_marks
        assignment = db.query(Assignment).filter(
            Assignment.id == submission.assignment_id
        ).first()
 
        if not assignment:
            submission.status = "error"
            db.commit()
            return {"error": "Assignment not found"}
 
        # Make sure the uploaded file exists on disk
        if not submission.file_path or not os.path.exists(submission.file_path):
            submission.status = "error"
            db.commit()
            return {"error": "Uploaded file not found"}
 
        # Extract text from the document
        from services.document_service import extract_text, clean_text, grade_document
        raw_text = extract_text(submission.file_path)
        clean    = clean_text(raw_text)
 
        if not clean or len(clean) < 50:
            submission.status = "error"
            db.commit()
            return {"error": "Could not extract meaningful text from document"}
 
        print(f"[DOC WORKER] Extracted {len(clean)} chars. Sending to AI...")
 
        # AI grades the document and returns a score (0-100 scale)
        ai_feedback = grade_document(
            extracted_text=clean,
            assignment_title=assignment.title,
            assignment_description=assignment.description,
        )
 
        print(f"[DOC WORKER] AI done. Score: {ai_feedback.get('score')}")
 
        # AI returns score as a value out of 100.
        # We treat that as obtained marks out of total_marks to get standardized score.
        # Example: AI score=75, total_marks=50 → obtained=(75/100)*50=37.5 → std=(37.5/50)*10=7.5
        raw_score   = ai_feedback.get("score", 0)
        total_marks = assignment.total_marks or 100.0
        obtained_marks = (raw_score / 100.0) * total_marks
        std_score = calculate_standardized_score(obtained_marks, total_marks)
 
        submission.score              = raw_score
        submission.passed             = None
        submission.total              = None
        submission.test_results       = "[]"
        submission.ai_feedback        = json.dumps(ai_feedback)
        submission.standardized_score = std_score
        submission.status             = "completed"
        db.commit()
 
        print(f"[DOC WORKER] Done: {submission_id} | Score: {raw_score} | Standardized: {std_score}/10")
        return {
            "submission_id":      submission_id,
            "score":              raw_score,
            "standardized_score": std_score,
            "status":             "completed"
        }
 
    except Exception as e:
        sub = db.query(Submission).filter(Submission.id == submission_id).first()
        if sub:
            sub.status = "error"
            db.commit()
        print(f"[DOC WORKER] Error: {str(e)}")
        return {"error": str(e)}
 
    finally:
        db.close()
 
 
@celery_app.task(name="evaluate_handwritten")
def evaluate_handwritten(submission_id: str):
    db = SessionLocal()
 
    try:
        submission = db.query(Submission).filter(
            Submission.id == submission_id
        ).first()
 
        if not submission:
            return {"error": "Submission not found"}
 
        submission.status = "processing"
        db.commit()
 
        print(f"[HW WORKER] Processing: {submission_id}")
 
        # Fetch assignment to get description and total_marks
        assignment = db.query(Assignment).filter(
            Assignment.id == submission.assignment_id
        ).first()
 
        if not assignment:
            submission.status = "error"
            db.commit()
            return {"error": "Assignment not found"}
 
        # Make sure the uploaded file exists on disk
        if not submission.file_path or not os.path.exists(submission.file_path):
            submission.status = "error"
            db.commit()
            return {"error": "Uploaded file not found"}
 
        print(f"[HW WORKER] File found. Running pipeline...")
 
        # Run the handwritten grading pipeline
        from services.handwritten_service import grade_handwritten
        ai_feedback = grade_handwritten(
            file_path=submission.file_path,
            assignment_title=assignment.title,
            assignment_description=assignment.description,
            grading_criteria=assignment.description
        )
 
        print(f"[HW WORKER] AI done. Score: {ai_feedback.get('score')}")
 
        # Same logic as document — AI score is out of 100, normalize to total_marks scale
        raw_score   = ai_feedback.get("score", 0)
        total_marks = assignment.total_marks or 100.0
        obtained_marks = (raw_score / 100.0) * total_marks
        std_score = calculate_standardized_score(obtained_marks, total_marks)
 
        submission.score              = raw_score
        submission.passed             = None
        submission.total              = None
        submission.test_results       = "[]"
        submission.ai_feedback        = json.dumps(ai_feedback)
        submission.standardized_score = std_score
        submission.status             = "completed"
        db.commit()
 
        print(f"[HW WORKER] Done: {submission_id} | Score: {raw_score} | Standardized: {std_score}/10")
        return {
            "submission_id":      submission_id,
            "score":              raw_score,
            "standardized_score": std_score,
            "status":             "completed"
        }
 
    except Exception as e:
        sub = db.query(Submission).filter(Submission.id == submission_id).first()
        if sub:
            sub.status = "error"
            db.commit()
        print(f"[HW WORKER] Error: {str(e)}")
        return {"error": str(e)}
 
    finally:
        db.close()