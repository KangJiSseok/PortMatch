from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException

from graph.company_graph import build_graph
from graph.state import CompanyGraphState
from web.schemas.company_project_analysis import (
    CompanyProjectAnalysisRequest,
    CompanyProjectAnalysisResponse,
)

load_dotenv()

app = FastAPI(title="Inference API")


@app.post(
    "/api/company-project-analysis", response_model=CompanyProjectAnalysisResponse
)
def get_structured_projects(
    payload: CompanyProjectAnalysisRequest,
) -> CompanyProjectAnalysisResponse:
    company_name = payload.company_name.strip()
    if not company_name:
        raise HTTPException(status_code=400, detail="company_name is required")

    graph = build_graph()
    initial_state: CompanyGraphState = {"company_name": company_name}
    result: Any = graph.invoke(initial_state)
    structured = result.get("structured_projects", [])
    if not isinstance(structured, list):
        structured = []
    return CompanyProjectAnalysisResponse(projects=structured)
