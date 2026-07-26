# Scheduled task runner — checks every day for upcoming assignment deadlines
# and sends reminder emails to students who have not submitted yet.
# APScheduler runs inside the FastAPI process — no separate server needed.

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron         import CronTrigger
from datetime                          import datetime, timedelta
import pytz

# Pakistan Standard Time timezone
TIMEZONE = pytz.timezone("Asia/Karachi")


def check_due_date_reminders():
    """
    Runs every day at 8:00 AM PKT.
    Finds all assignments due within the next 24 hours.
    For each one, finds enrolled students who have NOT submitted yet.
    Sends each of them a reminder email.

    DB imports are done inside the function to avoid circular import
    issues at startup when the scheduler is registered before the app fully loads.
    """
    from services.database      import SessionLocal, Assignment, Submission, Enrollment, User, Course
    from services.email_service import send_due_date_reminder

    print(f"[Scheduler] Running due-date reminder check — {datetime.now()}")

    db = SessionLocal()

    try:
        now        = datetime.utcnow()
        window_end = now + timedelta(hours=24)

        # Fetch all active assignments that have a due date set
        all_assignments = db.query(Assignment).filter(
            Assignment.due_date.isnot(None),
            Assignment.status == "ready",
        ).all()

        # Filter to only those due within the next 24 hours.
        # Done in Python because due_date is stored as a VARCHAR string.
        due_soon = []
        for a in all_assignments:
            try:
                if "T" in a.due_date:
                    # Format: "2026-05-20T23:59"
                    due_dt = datetime.fromisoformat(a.due_date)
                else:
                    # Format: "2026-05-20" — treat as end of that day
                    due_dt = datetime.strptime(a.due_date, "%Y-%m-%d").replace(
                        hour=23, minute=59
                    )

                if now <= due_dt <= window_end:
                    hours_left = max(1, int((due_dt - now).total_seconds() / 3600))
                    due_soon.append((a, hours_left))

            except Exception:
                # Skip any assignment whose due_date string cannot be parsed
                continue

        if not due_soon:
            print("[Scheduler] No assignments due in the next 24 hours.")
            return

        print(f"[Scheduler] {len(due_soon)} assignment(s) due soon — checking submissions...")

        for assignment, hours_left in due_soon:
            # All students enrolled in this course
            enrollments = db.query(Enrollment).filter(
                Enrollment.course_id == assignment.course_id
            ).all()
            enrolled_ids = {e.student_id for e in enrollments}

            # Students who have already submitted (any non-error status)
            existing = db.query(Submission).filter(
                Submission.assignment_id == assignment.id,
                Submission.status.in_(["completed", "processing", "pending"]),
            ).all()
            submitted_ids = {int(s.student_id) for s in existing}

            # Only remind students who have NOT submitted yet
            pending_ids = enrolled_ids - submitted_ids

            if not pending_ids:
                print(f"[Scheduler] '{assignment.title}' — all students submitted, skipping.")
                continue

            # Get course info for the email
            course = db.query(Course).filter(Course.id == assignment.course_id).first()
            if not course:
                continue

            # Send reminder to each pending student
            students = db.query(User).filter(User.id.in_(pending_ids)).all()
            for student in students:
                try:
                    send_due_date_reminder(
                        student_email    = student.email,
                        student_name     = student.name,
                        course_title     = course.title,
                        course_code      = course.code,
                        assignment_title = assignment.title,
                        due_date         = assignment.due_date,
                        hours_left       = hours_left,
                    )
                except Exception as e:
                    print(f"[Scheduler] Could not email {student.email}: {e}")

    except Exception as e:
        print(f"[Scheduler] Unexpected error: {e}")

    finally:
        db.close()


def start_scheduler():
    """
    Creates the APScheduler instance and registers the daily reminder job.
    Called once during FastAPI startup via the lifespan context manager in main.py.
    Runs check_due_date_reminders every day at 08:00 AM PKT.
    """
    scheduler = BackgroundScheduler(timezone=TIMEZONE)

    scheduler.add_job(
        func             = check_due_date_reminders,
        trigger          = CronTrigger(hour=8, minute=0, timezone=TIMEZONE),
        id               = "due_date_reminder",
        name             = "Daily due date reminder emails",
        replace_existing = True,
    )

    scheduler.start()
    print("[Scheduler] Started — reminders will run daily at 08:00 AM PKT")
    return scheduler
