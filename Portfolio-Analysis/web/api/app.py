from fastapi import FastAPI

from .routes.parse import router as parse_router

app = FastAPI()
app.include_router(parse_router)
