import os
from dotenv import load_dotenv

load_dotenv()

PPLX_MODEL = os.getenv("PPLX_MODEL", "sonar")
PPLX_BASE_URL = os.getenv("PPLX_BASE_URL", "https://api.perplexity.ai")
LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", "0.2"))
