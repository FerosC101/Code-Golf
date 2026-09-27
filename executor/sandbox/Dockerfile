# Throwaway image each submission runs in. Built once, started per job with
# --network none, --read-only, a tmpfs /tmp, memory/cpu/pid caps, no caps.
FROM python:3.12-alpine
RUN adduser -D -H -u 10001 golfer
COPY runner.py guard.py /sandbox/
RUN chmod 0555 /sandbox && chmod 0444 /sandbox/*.py
USER 10001:10001
ENV CG_WORKDIR=/tmp PYTHONDONTWRITEBYTECODE=1
ENTRYPOINT ["python", "-I", "-B", "/sandbox/runner.py"]
