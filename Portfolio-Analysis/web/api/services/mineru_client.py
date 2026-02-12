import os
import tempfile
import logging
import asyncio
import redis
import httpx
from fastapi import HTTPException

# 설정값들은 프로젝트의 config나 환경변수에서 가져온다고 가정해
from ..config import HTTP_TIMEOUT, MINERU_ENDPOINTS, MINERU_FORM_DATA

logger = logging.getLogger(__name__)

# Redis 연결 (환경변수 설정에 맞게 수정해줘)
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "127.0.0.1"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    password=os.getenv("REDIS_PASSWORD", None),
    db=0
)

async def fetch_mineru_content(s3_url: str, max_retries: int = 3) -> tuple[str, bytes]:
    """
    PDF 다운로드 → MinerU 요청 (Redis 기반 라운드 로빈 + 자동 재시도)
    """
    tmp_path = None
    
    # 1. S3에서 PDF 다운로드
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        try:
            async with client.stream("GET", str(s3_url), follow_redirects=True) as download:
                download.raise_for_status()
                with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp_file:
                    tmp_path = tmp_file.name
                    async for chunk in download.aiter_bytes():
                        tmp_file.write(chunk)
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail=f"failed to download s3 file: {exc}") from exc
        
        # 2. MinerU 서버에 PDF 전송 (라운드 로빈)
        last_exception = None
        num_endpoints = len(MINERU_ENDPOINTS)
        
        for attempt in range(max_retries):
            try:
                # ✅ Redis를 이용해 모든 워커가 공유하는 순차 인덱스 생성
                # incr()는 1, 2, 3... 순서대로 숫자를 올려줘
                current_count = redis_client.incr("mineru_rr_index")
                
                # ✅ 나머지 연산으로 호출할 서버 결정 (0, 1, 2 반복)
                idx = current_count % num_endpoints
                endpoint = MINERU_ENDPOINTS[idx]
                
                logger.info(f"[시도 {attempt+1}/{max_retries}] 라운드로빈 요청 → {endpoint}")
                
                with open(tmp_path, "rb") as pdf_file:
                    files = {"files": ("document.pdf", pdf_file, "application/pdf")}
                    resp = await client.post(endpoint, files=files, data=MINERU_FORM_DATA)
                    resp.raise_for_status()
                
                logger.info(f"✅ MinerU 성공: {endpoint}")
                
                # 성공 시 임시 파일 삭제
                if tmp_path and os.path.exists(tmp_path):
                    os.remove(tmp_path)
                
                content_type = resp.headers.get("content-type", "application/json")
                return content_type, resp.content
            
            except httpx.HTTPError as exc:
                logger.error(f" MinerU 실패: {endpoint} - {exc}")
                last_exception = exc
                # 실패 시 바로 다음 인덱스 서버를 시도하도록 루프 지속
                continue
        
        # 모든 시도 실패 시 파일 삭제
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)
        
        raise HTTPException(
            status_code=502, 
            detail=f"모든 MinerU 서버 실패 ({max_retries}회 시도): {last_exception}"
        ) from last_exception