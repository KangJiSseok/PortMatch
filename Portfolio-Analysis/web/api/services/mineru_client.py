import os
import tempfile
import logging
import asyncio
import httpx
from fastapi import HTTPException

from ..config import HTTP_TIMEOUT, MINERU_FORM_DATA

logger = logging.getLogger(__name__)


async def fetch_mineru_content(s3_url: str, port: str, max_retries: int = 3) -> tuple[str, bytes]:
    """
    PDF 다운로드 → 할당된 포트로 MinerU 요청
    
    Args:
        s3_url: S3 프리사인드 URL
        port: 할당받은 MinerU 포트 (예: "18001")
        max_retries: 실패 시 재시도 횟수
    
    Returns:
        (content_type, content_bytes)
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
        
        # 2. 할당받은 포트로 MinerU 요청
        endpoint = f"http://127.0.0.1:{port}/file_parse"
        last_exception = None
        
        for attempt in range(max_retries):
            try:
                logger.info(f"[시도 {attempt+1}/{max_retries}] MinerU 요청 → {endpoint}")
                
                with open(tmp_path, "rb") as pdf_file:
                    files = {"files": ("document.pdf", pdf_file, "application/pdf")}
                    resp = await client.post(endpoint, files=files, data=MINERU_FORM_DATA)
                    resp.raise_for_status()
                
                logger.info(f"✅ MinerU 성공 (Port: {port})")
                
                # 성공 시 임시 파일 삭제
                if tmp_path and os.path.exists(tmp_path):
                    os.remove(tmp_path)
                
                content_type = resp.headers.get("content-type", "application/json")
                return content_type, resp.content
            
            except httpx.HTTPError as exc:
                logger.error(f"❌ MinerU 실패 (Port: {port}): {exc}")
                last_exception = exc
                
                if attempt < max_retries - 1:
                    await asyncio.sleep(2)  # 2초 대기 후 재시도
                    continue
        
        # 모든 시도 실패 시 파일 삭제
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)
        
        raise HTTPException(
            status_code=502, 
            detail=f"Port {port} MinerU 서버 실패 ({max_retries}회 시도): {last_exception}"
        ) from last_exception