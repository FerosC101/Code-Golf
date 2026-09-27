"""Runs inside the sandbox before participant code.

Defence in depth only: the container (no network, read-only root, pids and
memory caps, unprivileged user) is the real boundary. This just turns the
obvious footguns into a clean runtime error."""

import os
import sys

_BLOCKED_EVENTS = frozenset(
    {
        "os.system", "os.exec", "os.posix_spawn", "os.spawn", "os.fork", "os.forkpty",
        "os.kill", "os.killpg", "subprocess.Popen", "pty.spawn",
        "socket.__new__", "socket.connect", "socket.bind", "socket.getaddrinfo",
        "ctypes.dlopen", "ctypes.dlsym", "ctypes.cdata",
        "os.remove", "os.rmdir", "os.rename", "os.replace", "shutil.rmtree", "shutil.move",
        "os.chmod", "os.chown", "os.symlink", "os.link", "os.truncate", "os.mkdir",
        "os.putenv", "os.unsetenv", "os.chdir", "os.setuid", "os.setgid",
        "sys.remote_exec", "webbrowser.open",
    }
)
_BLOCKED_MODULES = frozenset({"ctypes", "_ctypes", "socket", "_socket", "ssl", "_ssl", "multiprocessing"})
_WRITE_FLAGS = os.O_WRONLY | os.O_RDWR | os.O_CREAT | os.O_APPEND | os.O_TRUNC


def _hook(event: str, args: tuple) -> None:
    if event in _BLOCKED_EVENTS:
        raise PermissionError(f"PYTHON CRIMES DETECTED: {event} is not allowed")
    if event == "import" and args and args[0] in _BLOCKED_MODULES:
        raise PermissionError(f"PYTHON CRIMES DETECTED: import {args[0]} is not allowed")
    if event == "open" and len(args) >= 3:
        mode, flags = args[1], args[2]
        writing = (isinstance(mode, str) and any(c in mode for c in "wax+")) or (
            isinstance(flags, int) and flags & _WRITE_FLAGS
        )
        if writing:
            raise PermissionError("PYTHON CRIMES DETECTED: writing files is not allowed")


def main() -> None:
    path = sys.argv[1]
    sys.argv = [path]
    with open(path, encoding="utf-8") as fh:
        source = fh.read()
    code = compile(source, "main.py", "exec")
    sys.addaudithook(_hook)
    exec(code, {"__name__": "__main__", "__builtins__": __builtins__})


if __name__ == "__main__":
    main()
