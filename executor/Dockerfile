FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
# Docker CLI for EXEC_MODE=docker (one sibling container per submission).
# Unused in EXEC_MODE=process (e.g. Render, which has no Docker daemon).
COPY --from=docker:27-cli /usr/local/bin/docker /usr/local/bin/docker
COPY --from=ghcr.io/astral-sh/uv:0.5 /uv /usr/local/bin/uv
WORKDIR /app
COPY pyproject.toml ./
RUN uv pip install --system --no-cache -r pyproject.toml
COPY app ./app
COPY sandbox ./sandbox
RUN chmod -R a-w /app && useradd --uid 10002 --no-create-home runner
# Non-root by default. docker-compose overrides to root for the Docker socket.
USER runner
EXPOSE 8001
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8001}"]
