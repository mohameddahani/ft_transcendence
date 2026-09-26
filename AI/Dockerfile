FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app

COPY requirements.txt .
# chromadb installs these but we never use them (~140 MB)
RUN pip install --no-cache-dir -r requirements.txt \
 && pip uninstall -y onnxruntime kubernetes

# /data holds the SQLite memory and the Chroma vectors
RUN adduser --disabled-password --gecos "" appuser \
 && mkdir -p /data && chown appuser:appuser /data

# code stays owned by root, so the app can't modify itself
COPY app/ ./app/
USER appuser

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
