import os
import httpx
from dotenv import load_dotenv

load_dotenv()

_raw_mineru_endpoints = os.getenv("MINERU_ENDPOINTSS", "").strip()
if _raw_mineru_endpoints:
    MINERU_ENDPOINTS = [e.strip() for e in _raw_mineru_endpoints.split(",") if e.strip()]
else:
    MINERU_ENDPOINTS = [os.getenv("MINERU_ENDPOINT", "http://localhost:18001/file_parse")]

MINERU_ENDPOINT = MINERU_ENDPOINTS[0]
HTTP_TIMEOUT = httpx.Timeout(300.0, connect=10.0)
MINERU_FORM_DATA = {
    "return_content_list": "true",
    "return_middle_json": "false",
    "lang_list": "korean",
    "backend": "pipeline",
    "return_images": "false",
    "return_md": "false",
    "response_format_zip": "false",
}

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))

MINERU_SEMAPHORE_KEY = os.getenv("MINERU_SEMAPHORE_KEY", "mineru:semaphore")
MINERU_SEMAPHORE_LIMIT = int(os.getenv("MINERU_SEMAPHORE_LIMIT", "2"))
MINERU_SEMAPHORE_WAIT_SECONDS = int(os.getenv("MINERU_SEMAPHORE_WAIT_SECONDS", "120"))

OPENAI_MODEL = "gpt-4o-mini"
OPENAI_TEMPERATURE = 0.2
