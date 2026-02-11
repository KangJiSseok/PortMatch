import os
import httpx
from typing import List
from dotenv import load_dotenv

load_dotenv()

# ===== 기존 단일 엔드포인트 (하위 호환성) =====
MINERU_ENDPOINT = os.getenv("MINERU_ENDPOINT", "http://localhost:18001/file_parse")

# ===== 새로운 다중 엔드포인트 (부하 분산) =====
MINERU_ENDPOINTS_STR = os.getenv(
    "MINERU_ENDPOINTS", 
    MINERU_ENDPOINT  # 기본값: 기존 단일 엔드포인트
)
MINERU_ENDPOINTS: List[str] = [
    ep.strip() 
    for ep in MINERU_ENDPOINTS_STR.split(",") 
    if ep.strip()
]

# ===== 기존 설정 유지 =====
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

OPENAI_MODEL = "gpt-4o-mini"
OPENAI_TEMPERATURE = 0.2