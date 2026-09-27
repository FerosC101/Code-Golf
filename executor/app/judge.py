import re

from app.sandbox import RawResult

_PATH = re.compile(r'File "(?!main\.py)[^"]*"')


def outputs_match(actual: str, expected: str) -> bool:
    """Ignore trailing whitespace on each line and trailing blank lines."""

    def norm(text: str) -> list[str]:
        lines = [line.rstrip() for line in text.replace("\r\n", "\n").split("\n")]
        while lines and not lines[-1]:
            lines.pop()
        return lines

    return norm(actual) == norm(expected)


def error_line(stderr: str) -> str:
    """Last line of the traceback only, e.g. "NameError: name 'x' is not defined".
    Never leak interpreter paths."""
    lines = [line for line in stderr.strip().splitlines() if line.strip()]
    return _PATH.sub('File "<sandbox>"', lines[-1])[:200] if lines else ""


def verdict(raw: RawResult, expected: str) -> dict:
    if raw.timeout:
        return {"status": "timeout", "stdout": raw.stdout[:2000], "error": "Time limit exceeded"}
    if raw.exit != 0:
        return {"status": "runtime_error", "stdout": raw.stdout[:2000], "error": error_line(raw.stderr) or "Runtime error"}
    status = "passed" if outputs_match(raw.stdout, expected) else "failed"
    return {"status": status, "stdout": raw.stdout[:2000], "error": ""}
