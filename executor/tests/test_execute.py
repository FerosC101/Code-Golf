import os

os.environ["EXEC_MODE"] = "process"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

client = TestClient(app)
HEAD = {"X-Executor-Token": "dev-executor-token"}


def run(code, tests, time_limit=2.0):
    r = client.post("/execute", headers=HEAD, json={"code": code, "tests": tests, "time_limit": time_limit})
    assert r.status_code == 200, r.text
    return [x["status"] for x in r.json()["results"]], r.json()["results"]


def test_requires_token():
    r = client.post("/execute", json={"code": "print(1)", "tests": [{"input": "", "expected_output": "1"}]})
    assert r.status_code == 401


def test_pass_and_fail():
    tests = [{"input": "racecar", "expected_output": "True"}, {"input": "ab", "expected_output": "True"}]
    statuses, _ = run("s=input();print(s==s[::-1])", tests)
    assert statuses == ["passed", "failed"]


def test_trailing_whitespace_ignored():
    statuses, _ = run("print('1  ');print()", [{"input": "", "expected_output": "1\n"}])
    assert statuses == ["passed"]


def test_runtime_error_hides_paths():
    statuses, results = run("print(x)", [{"input": "", "expected_output": ""}])
    assert statuses == ["runtime_error"]
    assert results[0]["error"] == "NameError: name 'x' is not defined"


def test_timeout():
    statuses, _ = run("while 1:pass", [{"input": "", "expected_output": ""}], time_limit=0.5)
    assert statuses == ["timeout"]


def test_blocked_operations():
    for code in ["import os;os.system('ls')", "import socket", "open('x','w')", "import subprocess;subprocess.run(['ls'])"]:
        statuses, results = run(code, [{"input": "", "expected_output": ""}])
        assert statuses == ["runtime_error"], code
        assert "PYTHON CRIMES DETECTED" in results[0]["error"], (code, results[0])


def test_reading_and_exec_still_work():
    statuses, _ = run("exec('print(sum(map(int,input())))')", [{"input": "123", "expected_output": "6"}])
    assert statuses == ["passed"]
