# Handwritten Assignment Grading Service
# Handles the complete pipeline: file loading, preprocessing, OCR, prompt building, and LLM grading

import os
import time
import base64
import json
import cv2
import numpy as np
from PIL import Image
from pdf2image import convert_from_path
from google import genai
from google.genai import types
from groq import Groq

# Constants
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
GROQ_MODEL = "llama-3.3-70b-versatile"
MAX_RETRIES = 3
RETRY_DELAY = 5
SUPPORTED_FORMATS = {'jpg', 'jpeg', 'png', 'pdf'}

OCR_PROMPT = """You are an OCR engine. Extract all handwritten text from the provided assignment images exactly as written. Do not change, add or remove any word.

Rules:
- If multiple images are provided, label each page as PAGE 1:, PAGE 2:, etc.
- Preserve original structure — paragraphs, line breaks, lists
- Do not correct spelling or grammar
- Do not add any commentary or explanation
- If a page is blank or unreadable, write: PAGE N: [unreadable]
"""


def _load_file(file_path):
    # Validates file format and returns list of PIL Images
    # PDF returns one PIL Image per page, images return single-item list
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    ext = file_path.lower().rsplit('.', 1)[-1]

    if ext not in SUPPORTED_FORMATS:
        raise ValueError(f"Unsupported format: {ext}. Allowed: {SUPPORTED_FORMATS}")

    if ext == 'pdf':
        poppler_path = os.getenv("POPPLER_PATH", None)
        pages = convert_from_path(file_path, poppler_path=poppler_path)
        return pages

    else:
        img = Image.open(file_path).convert('RGB')
        return [img]


def _preprocess(pil_images):
    # Converts PIL Images to 2x resized BGR numpy arrays for Gemini Vision
    return [_resize(img) for img in pil_images]


def _resize(pil_image):
    # Applies 2x bicubic resize to a single PIL Image
    cv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
    h, w = cv_image.shape[:2]
    return cv2.resize(cv_image, (w * 2, h * 2), interpolation=cv2.INTER_CUBIC)


def _build_parts(cv_images):
    # Converts BGR numpy arrays to Gemini-compatible image parts with OCR prompt
    parts = []
    for cv_image in cv_images:
        _, buffer = cv2.imencode('.jpg', cv_image)
        b64 = base64.b64encode(buffer).decode('utf-8')
        parts.append(types.Part(
            inline_data=types.Blob(
                mime_type="image/jpeg",
                data=b64
            )
        ))
    parts.append(types.Part(text=OCR_PROMPT))
    return parts

def _extract_text(cv_images):
    # Sends preprocessed images to Gemini Vision for OCR
    # Retries up to 3 times on 503 errors with 5 second gap
    api_key = os.getenv("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key)
    parts = _build_parts(cv_images)

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=[types.Content(
                    role="user",
                    parts=parts
                )]
            )
            return response.text

        except Exception as e:
            error_str = str(e)
            if "503" in error_str or "UNAVAILABLE" in error_str:
                if attempt < MAX_RETRIES:
                    time.sleep(RETRY_DELAY)
                    continue
            raise RuntimeError(f"Gemini OCR failed after {attempt} attempt(s): {e}")

    raise RuntimeError("Gemini OCR failed after all retries")


def _build_prompt(ocr_text, assignment_title, assignment_description, grading_criteria):
    # Combines OCR text and assignment details into a grading prompt for Groq
    prompt = f"""You are an assignment grader. Grade the following handwritten student assignment.

Assignment Title: {assignment_title}

Assignment Description:
{assignment_description}

Grading Criteria:
{grading_criteria}

Student's Handwritten Submission (extracted via Gemini Vision):
{ocr_text}

Instructions:
- Grade strictly based on the grading criteria provided
- Be fair and objective
- If a page says [unreadable], note it in your summary

Respond ONLY in the following JSON format, no extra text:
{{
    "score": <integer 0-100>,
    "summary": "<overall feedback in 2-3 sentences>",
    "suggestions": ["<suggestion 1>", "<suggestion 2>"],
    "missed_points": ["<missed point 1>", "<missed point 2>"],
    "writing_clarity": <integer 1-10>
}}"""
    return prompt


def _grade(prompt):
    # Sends grading prompt to Groq LLM and returns parsed feedback dict
    api_key = os.getenv("GROQ_API_KEY")
    client = Groq(api_key=api_key)

    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0,
        response_format={"type": "json_object"}
    )

    raw = response.choices[0].message.content
    return json.loads(raw)


def grade_handwritten(file_path, assignment_title, assignment_description, grading_criteria):
    # Main entry point — accepts file path and assignment details, returns feedback dict
    pil_images = _load_file(file_path)
    cv_images = _preprocess(pil_images)
    ocr_text = _extract_text(cv_images)
    prompt = _build_prompt(ocr_text, assignment_title, assignment_description, grading_criteria)
    feedback = _grade(prompt)
    return feedback 