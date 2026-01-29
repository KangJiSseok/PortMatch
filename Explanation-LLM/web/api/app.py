from dotenv import load_dotenv
from fastapi import FastAPI

from .routes.explanation import router as explanation_router

load_dotenv()

app = FastAPI(title="Explanation LLM API")
app.include_router(explanation_router)
