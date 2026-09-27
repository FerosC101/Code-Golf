"""Sandbox harness. Reads a job as JSON on stdin, runs the code once per test
input in a fresh interpreter, and writes raw results as JSON on stdout.

Expected outputs never enter the sandbox: comparison happens outside."""

import json
import os
import resource
import subprocess
import sys
import tempfile

OUTPUT_CAP = 64 * 1024
IS_LINUX = sys.platform.startswith("linux")
GUARD = os.path.join(os.path.dirname(os.path.abspath(__file__)), "guard.py")


def _limits(time_limit: float, memory_mb: int):
    def apply() -> None:
        cpu = int(time_limit) + 1
        resource.setrlimit(resource.RLIMIT_CPU, (cpu, cpu + 1))
        resource.setrlimit(resource.RLIMIT_FSIZE, (OUTPUT_CAP * 4, OUTPUT_CAP * 4))
        resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
        resource.setrlimit(resource.RLIMIT_NOFILE, (32, 32))
        if IS_LINUX:
            mem = memory_mb * 1024 * 1024
            resource.setrlimit(resource.RLIMIT_AS, (mem, mem))
            # Fork-bomb brake for process mode (docker mode also has --pids-limit).
            resource.setrlimit(resource.RLIMIT_NPROC, (64, 64))
        os.setsid()

    return apply


def _read(path: str) -> str:
    with open(path, "rb") as fh:
        return fh.read(OUTPUT_CAP).decode("utf-8", errors="replace")


def main() -> None:
    job = json.load(sys.stdin)
    workdir = os.environ.get("CG_WORKDIR") or tempfile.gettempdir()
    time_limit = float(job.get("time_limit", 2.0))
    memory_mb = int(job.get("memory_mb", 256))
    main_py = os.path.join(workdir, "main.py")
    with open(main_py, "w", encoding="utf-8") as fh:
        fh.write(job["code"])

    results = []
    for index, stdin_text in enumerate(job["inputs"]):
        out_path = os.path.join(workdir, f"out{index}")
        err_path = os.path.join(workdir, f"err{index}")
        with open(out_path, "wb") as out, open(err_path, "wb") as err:
            proc = subprocess.Popen(
                [sys.executable, "-I", "-B", "-X", "utf8", GUARD, main_py],
                stdin=subprocess.PIPE,
                stdout=out,
                stderr=err,
                cwd=workdir,
                env={"PATH": "/usr/bin:/bin", "PYTHONIOENCODING": "utf-8", "PYTHONHASHSEED": "0"},
                preexec_fn=_limits(time_limit, memory_mb),
            )
            timed_out = False
            try:
                proc.communicate(stdin_text.encode("utf-8"), timeout=time_limit)
            except subprocess.TimeoutExpired:
                timed_out = True
                try:
                    os.killpg(proc.pid, 9)
                except ProcessLookupError:
                    pass
                proc.wait()
            except BrokenPipeError:
                proc.wait()
        results.append(
            {
                "exit": proc.returncode,
                "timeout": timed_out or proc.returncode == -24,  # SIGXCPU
                "stdout": _read(out_path),
                "stderr": _read(err_path),
            }
        )
        os.unlink(out_path)
        os.unlink(err_path)
    json.dump(results, sys.stdout)


if __name__ == "__main__":
    main()
