from typing import List

from pydantic import BaseModel, Field


class CompanyProjectAnalysisRequest(BaseModel):
    company_name: str = Field(..., min_length=1)


class ProjectResult(BaseModel):
    project_name: str
    problem: str
    solution: str
    tech: List[str]
    source_type: str
    source_is_valid: bool


class CompanyProjectAnalysisResponse(BaseModel):
    projects: List[ProjectResult]
