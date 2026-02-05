from fastapi import APIRouter, HTTPException
from celery.result import AsyncResult
from web.api.celery_app import celery_app

router = APIRouter()


@router.get("/api/tasks/{task_id}")
def get_task_status(task_id: str):
    """
    Celery Task 상태 및 결과 조회
    """
    task_result = AsyncResult(task_id, app=celery_app)
    
    response = {
        "task_id": task_id,
        "state": task_result.state,
    }
    
    if task_result.state == 'PENDING':
        response["status"] = "Task is waiting in queue..."
    
    elif task_result.state == 'STARTED':
        response["status"] = "Task is running..."
    
    elif task_result.state == 'SUCCESS':
        response["result"] = task_result.result
    
    elif task_result.state == 'FAILURE':
        response["error"] = str(task_result.info)
    
    elif task_result.state == 'RETRY':
        response["status"] = "Task is being retried..."
        response["retry_info"] = str(task_result.info)
    
    return response


@router.post("/api/tasks/{task_id}/cancel")
def cancel_task(task_id: str):
    """
    실행 중인 Task 취소
    """
    task_result = AsyncResult(task_id, app=celery_app)
    task_result.revoke(terminate=True)
    
    return {
        "task_id": task_id,
        "status": "cancelled"
    }