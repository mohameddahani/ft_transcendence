FROM python:3.12-slim

# No .pyc files in the image; unbuffered so logs reach `docker logs` immediately.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Dependencies first, and in their own layer: application code changes on every
# commit, requirements.txt almost never, so this pip install stays cached.
COPY requirements.txt .
# Two of Chroma's transitive dependencies are dead weight here and together they are
# ~140 MB of a 929 MB image:
#
#   onnxruntime  backs Chroma's *default* embedding function, a local MiniLM model.
#                We never use it -- embeddings come from Gemini and are passed in
#                explicitly -- and downloading a model at runtime is exactly what the
#                no-PyTorch rule (AI_PLAN §5) exists to avoid.
#   kubernetes   a client for deploying Chroma into a cluster. We run a persistent
#                client against a file on a volume.
#
# Removed after install rather than excluded, because pip has no way to decline a
# transitive dependency. Verified, not assumed: a persistent client, a cosine
# collection, an upsert and a metadata-filtered query all work without them, and if
# a future version imports either eagerly the image fails to boot -- loudly, at
# startup, which is the right place.
RUN pip install --no-cache-dir -r requirements.txt \
 && pip uninstall -y onnxruntime kubernetes \
 && python -c "import chromadb; chromadb.PersistentClient"

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
# Collection B ships inside the image, so the one-shot loader (ai-load) finds it on
# any machine with no mount: 150 cleaned documents, ~2.5 MB.
COPY corpus/business/docs/ ./corpus/business/docs/
RUN chown -R root:root /app && chmod -R a=rX /app

USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
