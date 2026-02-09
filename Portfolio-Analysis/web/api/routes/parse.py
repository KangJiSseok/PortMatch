import json

from fastapi import APIRouter, HTTPException, Request, Response
from ..chains.project_summary import build_project_summary_chain
from ..chains.text_extraction import TEXT_EXTRACTION_CHAIN
from ..chains.project_feedback import build_project_feedback_chain
from ..services.mineru_client import fetch_mineru_content

router = APIRouter()



@router.post("/api/parse")
async def parse_pdf(request: Request):
    raw_body = await request.body()
    if not raw_body:
        raise HTTPException(status_code=400, detail="s3_url is required")

    try:
        data = json.loads(raw_body)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="invalid JSON body") from exc

    s3_url = data.get("s3_url") if isinstance(data, dict) else None
    if not s3_url:
        raise HTTPException(status_code=400, detail="s3_url is required")

    content_type, content = await fetch_mineru_content(s3_url)
    if "application/json" in content_type:
        try:
            mineru_data = json.loads(content)
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=502, detail="mineru returned invalid JSON") from exc

        try:
            texts = TEXT_EXTRACTION_CHAIN.invoke(mineru_data)
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"failed to parse mineru response: {exc}") from exc

        content = "\n".join(texts)
        try:
            summary_chain = build_project_summary_chain()
            projects = summary_chain.invoke({"content": content})
        except Exception as exc:
            print(f"llm request failed: {exc}")
            raise HTTPException(status_code=502, detail=f"llm request failed: {exc}") from exc
        return {"projects": projects}

    return Response(content=content, media_type=content_type)


@router.post("/api/parse-v2")
async def parse_pdf_v2(request: Request):
    raw_body = await request.body()
    if not raw_body:
        raise HTTPException(status_code=400, detail="s3_url is required")

    try:
        data = json.loads(raw_body)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="invalid JSON body") from exc

    s3_url = data.get("s3_url") if isinstance(data, dict) else None
    if not s3_url:
        raise HTTPException(status_code=400, detail="s3_url is required")

    content_type, content = await fetch_mineru_content(s3_url)
    if "application/json" in content_type:
        try:
            mineru_data = json.loads(content)
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=502, detail="mineru returned invalid JSON") from exc

        try:
            texts = TEXT_EXTRACTION_CHAIN.invoke(mineru_data)
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"failed to parse mineru response: {exc}") from exc

        content = "\n".join(texts)
        try:
            feedback_chain = build_project_feedback_chain()
            result = feedback_chain.invoke({"content": content})
        except Exception as exc:
            print(f"llm request failed: {exc}")
            raise HTTPException(status_code=502, detail=f"llm request failed: {exc}") from exc

        return result

    return Response(content=content, media_type=content_type)
