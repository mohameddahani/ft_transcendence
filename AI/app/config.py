import os

# os.environ[...] crashes at startup if a variable is missing, instead of failing later
DATABASE_URL = os.environ["AI_DATABASE_URL"]              # ai_readonly: reads the gym data
STORE_DATABASE_URL = os.environ["AI_STORE_DATABASE_URL"]  # ai_writer: our own tables in schema ai

JWT_SECRETS = {
    "ADMIN": os.environ["JWT_ADMIN_ACCESS_SECRET"],
    "STAFF": os.environ["JWT_STAFF_ACCESS_SECRET"],
    "MEMBER": os.environ["JWT_MEMBER_ACCESS_SECRET"],
}
INTERNAL_API_KEY = os.environ["INTERNAL_API_KEY"]

GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
CHAT_MODEL = os.environ.get("GEMINI_CHAT_MODEL", "gemini-3.5-flash-lite")
EMBED_MODEL = os.environ.get("GEMINI_EMBED_MODEL", "gemini-embedding-001")
