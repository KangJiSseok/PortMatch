import json
from fastapi import APIRouter, HTTPException, Request
from ..task import parse_pdf_task, parse_pdf_v2_task

router = APIRouter()


@router.post("/api/parse")
async def parse_pdf(request: Request):
    """
    PDF 파싱 요청 (비동기 Task로 처리)
    """

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

    # ✅ Celery Task로 전송
    task = parse_pdf_task.delay(s3_url)
    
    return {
        "task_id": task.id,
        "status": "processing",
        "message": f"Check status at /api/tasks/{task.id}"
    }


@router.post("/api/parse-v2")
async def parse_pdf_v2(request: Request):
    """
    PDF 파싱 v2 요청 (피드백 생성, 비동기 Task로 처리)
    """

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

    # ✅ Celery Task로 전송
    task = parse_pdf_v2_task.delay(s3_url)
    
    return {
        "task_id": task.id,
        "status": "processing",
        "message": f"Check status at /api/tasks/{task.id}"
    }
