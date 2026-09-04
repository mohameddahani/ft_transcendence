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

# Copy as root, then hand ownership to nobody. appuser can read and execute the
# code but cannot modify it, so a compromised request handler cannot rewrite the
# application it is running inside.
COPY app/ ./app/
RUN chown -R root:root /app && chmod -R a=rX /app

USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
