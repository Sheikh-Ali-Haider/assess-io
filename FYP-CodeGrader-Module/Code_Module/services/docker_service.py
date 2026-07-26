import subprocess
import tempfile
import os

def run_python_code(source_code: str, input_data: str, timeout: int = 10):
    """Runs Python code inside a Docker sandbox."""
    with tempfile.TemporaryDirectory() as tmpdir:

        solution_path = os.path.join(tmpdir, "solution.py")
        with open(solution_path, "w") as f:
            f.write(source_code)

        input_path = os.path.join(tmpdir, "input.txt")
        with open(input_path, "w") as f:
            f.write(input_data)

        command = [
            "docker", "run", "--rm",
            "--network", "none",
            "--memory", "128m",
            "-v", f"{tmpdir}:/sandbox",
            "sandbox-python",
            "sh", "-c",
            "python /sandbox/solution.py < /sandbox/input.txt"
        ]

        try:
            result = subprocess.run(
                command, capture_output=True, text=True, timeout=timeout
            )
            return {
                "status": "success",
                "output": result.stdout.strip(),
                "error": result.stderr.strip()
            }
        except subprocess.TimeoutExpired:
            return {"status": "timeout", "output": "", "error": "Time Limit Exceeded"}
        except Exception as e:
            return {"status": "error", "output": "", "error": str(e)}


def run_cpp_code(source_code: str, input_data: str, timeout: int = 10):
    """Compiles and runs C++ code inside a Docker sandbox."""
    with tempfile.TemporaryDirectory() as tmpdir:

        # Write the C++ source file
        solution_path = os.path.join(tmpdir, "solution.cpp")
        with open(solution_path, "w") as f:
            f.write(source_code)

        # Write the input file
        input_path = os.path.join(tmpdir, "input.txt")
        with open(input_path, "w") as f:
            f.write(input_data)

        command = [
            "docker", "run", "--rm",
            "--network", "none",
            "--memory", "128m",
            "-v", f"{tmpdir}:/sandbox",
            "sandbox-python",  # g++ 14.2.0 (Debian) is installed in this image
            "sh", "-c",
            "g++ -o /sandbox/solution /sandbox/solution.cpp && /sandbox/solution < /sandbox/input.txt"
        ]

        try:
            result = subprocess.run(
                command, capture_output=True, text=True, timeout=timeout
            )

            # If compilation failed, return the compiler error
            if result.returncode != 0 and result.stderr:
                return {
                    "status": "error",
                    "output": "",
                    "error": result.stderr.strip()
                }

            return {
                "status": "success",
                "output": result.stdout.strip(),
                "error": result.stderr.strip()
            }
        except subprocess.TimeoutExpired:
            return {"status": "timeout", "output": "", "error": "Time Limit Exceeded"}
        except Exception as e:
            return {"status": "error", "output": "", "error": str(e)}


def run_test_cases(source_code: str, test_cases: list, language: str = "python", timeout: int = 10):
    """
    Runs multiple test cases and calculates the score.
    Supported languages: 'python' or 'cpp'
    """
    results = []
    passed = 0

    for i, test_case in enumerate(test_cases):

        # Choose the runner based on the language
        if language == "cpp":
            result = run_cpp_code(source_code, test_case["input"], timeout)
        else:
            result = run_python_code(source_code, test_case["input"], timeout)

        # Determine the verdict for this test case
        if result["status"] == "success":
            if result["output"] == test_case["expected_output"].strip():
                verdict = "PASS"
                passed += 1
            else:
                verdict = "FAIL"
        elif result["status"] == "timeout":
            verdict = "TIMEOUT"
        else:
            verdict = "FAIL"

        results.append({
            "test_case_id": i + 1,
            "verdict": verdict,
            "expected": test_case["expected_output"],
            "actual": result["output"],
            "error": result["error"]
        })

    total = len(test_cases)
    score = int((passed / total) * 100) if total > 0 else 0

    return {
        "results": results,
        "passed": passed,
        "total": total,
        "score": score
    }