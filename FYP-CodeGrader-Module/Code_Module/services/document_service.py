import os
import re
import json
import pdfplumber
import docx
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


def extract_text(file_path: str) -> str:
    """Extract text content from a PDF or DOCX file."""
    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":
        text = ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text

    elif ext in [".docx", ".doc"]:
        doc = docx.Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs])

    else:
        raise ValueError(f"Unsupported file type: {ext}")


def clean_text(text: str) -> str:
    """Remove extra whitespace and non-ASCII characters from text."""
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^\x00-\x7F]+', ' ', text)
    return text.strip()


def grade_document(
    extracted_text: str,
    assignment_title: str,
    assignment_description: str,
) -> dict:
    """
    Send the extracted document text to Groq AI for grading.
    Returns a feedback dict matching the agreed result format.
    """

    # Truncate to 6000 chars to stay within token limits
    truncated_text = extracted_text[:12000]

    prompt = f"""You are an academic assignment grader. Grade the following student submission.

Assignment Title: {assignment_title}
Assignment Description: {assignment_description}

Student Submission:
{truncated_text}

Grade this submission and respond ONLY with a valid JSON object in this exact format (no extra text, no markdown):
{{
  "score": <integer 0-100>,
  "summary": "<2-3 sentence overall assessment>",
  "suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"],
  "readability_score": <integer 1-10>,
  "time_complexity": "N/A",
  "space_complexity": "N/A",
  "missed_edge_cases": ["<missed point 1>", "<missed point 2>"]
}}

Scoring criteria: content quality, relevance to assignment, clarity, and completeness.
Be fair, constructive, and specific in your feedback."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=1000,
    )

    raw = response.choices[0].message.content.strip()

    # Strip markdown code fences if the model wrapped the JSON in them
    if "```" in raw:
        raw = re.sub(r"```[a-z]*", "", raw).replace("```", "").strip()

    try:
        feedback = json.loads(raw)
    except json.JSONDecodeError as e:
        raise ValueError(f"AI returned invalid JSON: {str(e)}\nRaw response: {raw}")

    # Validate that required keys exist in the response
    required_keys = ["score", "summary", "suggestions", "readability_score"]
    for key in required_keys:
        if key not in feedback:
            raise ValueError(f"AI response missing required field: '{key}'")

    # Make sure score is within valid range
    feedback["score"] = max(0, min(100, int(feedback["score"])))

    return feedback