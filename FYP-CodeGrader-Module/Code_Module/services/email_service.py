# Email service — handles all outgoing emails for the LMS
# Uses Python's built-in smtplib — no extra library needed

import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formatdate, make_msgid
from typing import Optional

# ── Gmail SMTP settings ────────────────────────────────────────────────────
# Add these two lines to your .env file:
#   SMTP_EMAIL=your_gmail@gmail.com
#   SMTP_PASSWORD=your_16_char_app_password

SMTP_HOST     = "smtp.gmail.com"
SMTP_PORT     = 587
SMTP_EMAIL    = os.getenv("SMTP_EMAIL", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
APP_NAME      = "Assess.io"


def _send_email(to_email: str, subject: str, html_body: str):
    """
    Core send function — builds the MIME email and sends it via Gmail SMTP.
    Proper headers are set to reduce chances of landing in spam.
    If SMTP is not configured, prints a warning and returns silently.
    """
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print(f"[Email] SMTP not configured — skipping email to {to_email}")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"]    = subject                          # no [APP_NAME] prefix — reduces spam score
    msg["From"]       = f"{APP_NAME} <{SMTP_EMAIL}>"
    msg["To"]         = to_email
    msg["Date"]       = formatdate(localtime=True)       # proper date header
    msg["Message-ID"] = make_msgid(domain="gmail.com")  # unique message ID — helps deliverability

    # Attach plain text version first — spam filters prefer emails with both versions
    plain_text = "You have a new notification from AI Grader. Please view this email in an HTML-capable client."
    msg.attach(MIMEText(plain_text, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()                                # second ehlo after starttls — better practice
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
        print(f"[Email] Sent: '{subject}' → {to_email}")
    except Exception as e:
        print(f"[Email] Failed to send to {to_email}: {e}")
        raise


def _base_template(title: str, body_html: str) -> str:
    """
    Wraps email content in a clean branded HTML layout.
    Every email sent from the system uses this template.
    """
    return f"""
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 16px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0"
                   style="background:#ffffff;border-radius:12px;overflow:hidden;
                          box-shadow:0 2px 8px rgba(0,0,0,0.08);">

              <!-- Header -->
              <tr>
                <td style="background:#1a3c5e;padding:24px 32px;">
                  <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">{APP_NAME}</h1>
                  <p  style="margin:4px 0 0;color:#93c5fd;font-size:13px;">{title}</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:32px;">
                  {body_html}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
                  <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
                    This is an automated message from {APP_NAME}. Please do not reply to this email.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """


def send_assignment_notification(
    student_email:    str,
    student_name:     str,
    course_title:     str,
    course_code:      str,
    assignment_title: str,
    assignment_type:  str,
    due_date:         Optional[str],
):
    """
    Called immediately when a professor creates a new assignment.
    Notifies the student about the new assignment and its due date.
    """
    due_text = due_date if due_date else "No due date set"
    type_label = {
        "code":        "💻 Code Assignment",
        "document":    "📄 Document Assignment",
        "handwritten": "✍️ Handwritten Assignment",
    }.get(assignment_type, "📋 Assignment")

    body = f"""
    <p style="color:#374151;font-size:15px;">Hi <strong>{student_name}</strong>,</p>

    <p style="color:#374151;font-size:14px;">
      A new assignment has been posted in
      <strong>{course_code} — {course_title}</strong>.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#f0f7ff;border-radius:8px;padding:20px;margin:20px 0;">
      <tr>
        <td>
          <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Assignment</p>
          <p style="margin:0 0 16px;font-size:17px;font-weight:700;color:#1a3c5e;">
            {assignment_title}
          </p>

          <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Type</p>
          <p style="margin:0 0 16px;font-size:14px;color:#374151;">{type_label}</p>

          <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Due Date</p>
          <p style="margin:0;font-size:14px;font-weight:600;color:#dc2626;">{due_text}</p>
        </td>
      </tr>
    </table>

    <p style="color:#374151;font-size:14px;">
      Log in to {APP_NAME} to view the full assignment details and submit your work on time.
    </p>

    <p style="color:#6b7280;font-size:13px;margin-top:24px;">
      Good luck!<br/>
      <strong>The {APP_NAME} Team</strong>
    </p>
    """

    _send_email(
        to_email  = student_email,
        subject   = f"New Assignment Posted: {assignment_title} — {course_code}",
        html_body = _base_template(f"New Assignment in {course_code}", body),
    )


def send_material_notification(
    student_email: str,
    student_name:  str,
    course_title:  str,
    course_code:   str,
    week_title:    str,
    material_name: str,
    material_type: str,
):
    """
    Called immediately when a professor uploads a study material (file or video).
    Notifies the student which week and course the material belongs to.
    """
    type_label = "📹 Video" if material_type == "video" else "📁 File"

    body = f"""
    <p style="color:#374151;font-size:15px;">Hi <strong>{student_name}</strong>,</p>

    <p style="color:#374151;font-size:14px;">
      New study material has been added in
      <strong>{course_code} — {course_title}</strong>.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#f0fdf4;border-radius:8px;padding:20px;margin:20px 0;">
      <tr>
        <td>
          <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Week</p>
          <p style="margin:0 0 16px;font-size:14px;font-weight:600;color:#374151;">
            {week_title}
          </p>

          <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Material</p>
          <p style="margin:0 0 16px;font-size:15px;font-weight:700;color:#1a3c5e;">
            {material_name}
          </p>

          <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Type</p>
          <p style="margin:0;font-size:14px;color:#374151;">{type_label}</p>
        </td>
      </tr>
    </table>

    <p style="color:#374151;font-size:14px;">
      Log in to {APP_NAME} to access this material.
    </p>

    <p style="color:#6b7280;font-size:13px;margin-top:24px;">
      Best regards,<br/>
      <strong>The {APP_NAME} Team</strong>
    </p>
    """

    _send_email(
        to_email  = student_email,
        subject   = f"New Study Material Available: {material_name} — {course_code}",
        html_body = _base_template(f"New Study Material in {course_code}", body),
    )


def send_due_date_reminder(
    student_email:    str,
    student_name:     str,
    course_title:     str,
    course_code:      str,
    assignment_title: str,
    due_date:         str,
    hours_left:       int,
):
    """
    Called by the daily scheduler for assignments due within 24 hours
    where the student has not submitted yet.
    Color changes to red when less than 12 hours remain.
    """
    urgency_color = "#dc2626" if hours_left <= 12 else "#f59e0b"
    hours_word    = "hour" if hours_left == 1 else "hours"

    body = f"""
    <p style="color:#374151;font-size:15px;">Hi <strong>{student_name}</strong>,</p>

    <p style="color:#374151;font-size:14px;">
      This is a reminder that the following assignment is due soon and we have
      not received your submission yet.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#fff7ed;border-left:4px solid {urgency_color};
                  border-radius:8px;padding:20px;margin:20px 0;">
      <tr>
        <td>
          <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Course</p>
          <p style="margin:0 0 16px;font-size:14px;color:#374151;">
            {course_code} — {course_title}
          </p>

          <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Assignment</p>
          <p style="margin:0 0 16px;font-size:17px;font-weight:700;color:#1a3c5e;">
            {assignment_title}
          </p>

          <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Due Date</p>
          <p style="margin:0 0 16px;font-size:14px;font-weight:600;color:{urgency_color};">
            {due_date}
          </p>

          <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Time Remaining</p>
          <p style="margin:0;font-size:15px;font-weight:700;color:{urgency_color};">
            ~{hours_left} {hours_word} left
          </p>
        </td>
      </tr>
    </table>

    <p style="color:#374151;font-size:14px;">
      Please log in to {APP_NAME} and submit before the deadline.
    </p>

    <p style="color:#6b7280;font-size:13px;margin-top:24px;">
      Best regards,<br/>
      <strong>The {APP_NAME} Team</strong>
    </p>
    """

    _send_email(
        to_email  = student_email,
        subject   = f"Reminder: {assignment_title} due in {hours_left} {hours_word} — {course_code}",
        html_body = _base_template("Assignment Due Soon", body),
    )