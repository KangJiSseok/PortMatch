import httpx
from dotenv import load_dotenv

load_dotenv()

MINERU_ENDPOINT = "http://localhost:18000/file_parse"
HTTP_TIMEOUT = httpx.Timeout(60.0, connect=10.0)
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
