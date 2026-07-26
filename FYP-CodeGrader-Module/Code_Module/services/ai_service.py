from groq import Groq
import json
import os
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


# ─────────────────────────────────────────────
#  HELPER — Strip markdown fences from AI output
# ─────────────────────────────────────────────

def strip_markdown(text: str) -> str:
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0]
    elif "```" in text:
        text = text.split("```")[1].split("```")[0]
    return text.strip()


# ─────────────────────────────────────────────
#  TEST CASE GENERATION
# ─────────────────────────────────────────────

def generate_test_cases(
    title: str,
    description: str,
    topic: str,
    language: str,
    sample_solution: str,
    num_test_cases: int
) -> list:
    """
    Generates strong, complete test cases using AI based on assignment details.
    Returns a list of dicts: [{"input": "...", "expected_output": "..."}]
    """

    prompt = f"""You are a senior programming instructor designing test cases for a university grading system.
These test cases will be used to automatically evaluate student code — so they must be 100% correct and complete.

─── ASSIGNMENT INFO ───
Title       : {title}
Topic       : {topic}
Language    : {language}
Description : {description}

Sample Solution / Expected Behavior:
{sample_solution if sample_solution else "Not provided — carefully infer correct behavior from the description above."}

─── YOUR TASK ───
Generate exactly {num_test_cases} test cases that together provide full coverage of the problem.

Distribute your test cases across these categories (cover as many as apply):
  1. NORMAL cases    — typical everyday inputs a student would expect
  2. BOUNDARY cases  — minimum value, maximum value, exactly at the limit
  3. EDGE cases      — empty input, zero, negative numbers, single element, very large numbers
  4. SPECIAL cases   — duplicate values, already sorted input, all same elements, whitespace handling

─── STRICT OUTPUT RULES ───
- "input"           : exactly what will be passed via stdin (use \\n for multiple lines)
- "expected_output" : EXACTLY what the program must print to stdout — character for character
- Do NOT include extra spaces, extra newlines, or explanations inside expected_output
- If output is a number, write the number only (e.g. "25" not "The answer is 25")
- If output has multiple lines, separate them with \\n
- Make sure every expected_output is mathematically/logically verified — do not guess

─── RESPONSE FORMAT ───
Respond ONLY with a valid JSON array. No explanation. No markdown. No extra text.

[
  {{"input": "<stdin input>", "expected_output": "<exact stdout>"}},
  {{"input": "<stdin input>", "expected_output": "<exact stdout>"}}
]"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,  # Low temperature = more deterministic, fewer mistakes
        max_tokens=2000,
    )

    raw = strip_markdown(response.choices[0].message.content)

    try:
        test_cases = json.loads(raw)
    except json.JSONDecodeError:
        raise Exception("AI returned invalid JSON for test cases. Please try generating again.")

    # Validate and clean each test case
    validated = []
    for tc in test_cases:
        if "input" in tc and "expected_output" in tc:
            validated.append({
                "input": str(tc["input"]),
                "expected_output": str(tc["expected_output"]).strip()
            })

    if not validated:
        raise Exception("AI did not return any valid test cases. Please try again.")

    return validated


# ─────────────────────────────────────────────
#  CODE ANALYSIS
# ─────────────────────────────────────────────

def analyze_code(source_code: str, language: str, test_results: list) -> dict:
    """
    Analyzes student code using AI after test case execution.
    Returns feedback dict with complexity, readability, suggestions, and overall assessment.
    """

    passed = sum(1 for r in test_results if r.get("verdict") == "PASS")
    total = len(test_results)

    prompt = f"""You are an expert code reviewer for a university assignment grading system.
Your job is to give honest, constructive, and detailed feedback on student code.

─── SUBMISSION INFO ───
Language     : {language}
Test Results : {passed} out of {total} test cases passed

─── STUDENT CODE ───
```{language}
{source_code}
```

─── YOUR TASK ───
Analyze this code carefully and return feedback in the exact JSON format below.

Evaluation criteria:
- Time and space complexity (with a short reason)
- Code readability (naming, structure, comments, clarity)
- Specific actionable suggestions for improvement
- Edge cases or scenarios the student's code fails to handle
- An honest overall assessment (mention both strengths and weaknesses)

─── RESPONSE FORMAT ───
Respond ONLY with this exact JSON. No explanation. No markdown. No extra text.

{{
    "time_complexity"  : "O(?) — one line explanation",
    "space_complexity" : "O(?) — one line explanation",
    "readability_score": <integer 1-10>,
    "suggestions"      : ["suggestion 1", "suggestion 2", "suggestion 3"],
    "edge_cases_missed": ["edge case 1", "edge case 2"],
    "overall_feedback" : "2-3 sentence honest assessment of the submission"
}}"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=1000,
    )

    raw = strip_markdown(response.choices[0].message.content)

    try:
        feedback = json.loads(raw)
        return feedback
    except json.JSONDecodeError:
        # Fallback if AI returns broken JSON — return partial data instead of crashing
        return {
            "time_complexity"  : "Could not analyze",
            "space_complexity" : "Could not analyze",
            "readability_score": 5,
            "suggestions"      : ["Manual review recommended for this submission."],
            "edge_cases_missed": [],
            "overall_feedback" : raw[:300] if raw else "AI analysis failed. Please review manually."
        }