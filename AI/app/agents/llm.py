

from langchain_google_genai import ChatGoogleGenerativeAI
from app.config import get_settings

def get_llm() -> ChatGoogleGenerativeAI:
    """Returns a configured ChatGoogleGenerativeAI instance."""
    settings = get_settings()
    
    return ChatGoogleGenerativeAI(
        model=settings.GEMINI_CHAT_MODEL,
        google_api_key=settings.GEMINI_API_KEY.get_secret_value(),
        temperature=0.0,
        max_retries=1,
        request_timeout=30.0,
    )