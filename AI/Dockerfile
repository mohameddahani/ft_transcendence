FROM python:3.12-slim

# No .pyc files in the image; unbuffered so logs reach `docker logs` immediately.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Dependencies first, and in their own layer: application code changes on every
# commit, requirements.txt almost never, so this pip install stays cached.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN adduser --disabled-password --gecos "" appuser

# The AI service's own state lives here: rate-limit events (task 0.7), LangGraph
# checkpoints (2.4), document metadata (3.x). A named volume is created ROOT-owned,
# and this container runs as appuser -- SQLite would fail with "unable to open
# database file". Docker copies ownership from the image's directory when it
# initialises an *empty* volume, so the fix is to create it here, before USER.
#
# Note the asymmetry with /app below: code is read-only to the runtime user, state
# is writable. A compromised handler can write rate counters; it cannot rewrite the
# application it is running inside.
RUN mkdir -p /data && chown appuser:appuser /data

# Copy as root, then hand ownership to nobody. appuser can read and execute the
# code but cannot modify it, so a compromised request handler cannot rewrite the
# application it is running inside.
COPY app/ ./app/
RUN chown -R root:root /app && chmod -R a=rX /app

USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
