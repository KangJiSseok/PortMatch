import os
import tempfile
import random
import logging

import httpx
from fastapi import HTTPException

from ..config import HTTP_TIMEOUT, MINERU_ENDPOINTS, MINERU_FORM_DATA

logger = logging.getLogger(__name__)


async def fetch_mineru_content(s3_url: str, max_retries: int = 3) -> tuple[str, bytes]:
    """
    PDF 다운로드 → MinerU 요청 (부하 분산 + 자동 재시도)
    
    Args:
        s3_url: S3 프리사인드 URL
        max_retries: MinerU 서버 실패 시 재시도 횟수
    
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
        
        # 2. MinerU 서버에 PDF 전송 (부하 분산 + 재시도)
        last_exception = None
        available_endpoints = MINERU_ENDPOINTS.copy()
        
        for attempt in range(max_retries):
            if not available_endpoints:
                logger.warning("⚠️ 모든 MinerU 서버 시도 실패. 리스트 초기화하고 재시도...")
                available_endpoints = MINERU_ENDPOINTS.copy()
            
            # 랜덤으로 서버 선택 (부하 분산)
            endpoint = random.choice(available_endpoints)
            
            try:
                logger.info(f"[시도 {attempt+1}/{max_retries}] MinerU 요청 → {endpoint}")
                
                with open(tmp_path, "rb") as pdf_file:
                    files = {"files": ("document.pdf", pdf_file, "application/pdf")}
                    resp = await client.post(endpoint, files=files, data=MINERU_FORM_DATA)
                    resp.raise_for_status()
                
                logger.info(f"✅ MinerU 성공: {endpoint}")
                
                # 성공 시 임시 파일 삭제 후 반환
                if tmp_path:
                    try:
                        os.remove(tmp_path)
                    except OSError:
                        pass
                
                content_type = resp.headers.get("content-type", "application/json")
                return content_type, resp.content
            
            except httpx.HTTPError as exc:
                logger.error(f"❌ MinerU 실패: {endpoint} - {exc}")
                available_endpoints.remove(endpoint)  # 실패한 서버는 제외
                last_exception = exc
                
                # 마지막 시도가 아니면 계속
                if attempt < max_retries - 1:
                    continue
        
        # 모든 시도 실패 → 임시 파일 삭제 후 에러
        if tmp_path:
            try:
                os.remove(tmp_path)
            except OSError:
                pass
        
        raise HTTPException(
            status_code=502, 
            detail=f"모든 MinerU 서버 실패 ({max_retries}회 시도): {last_exception}"
        ) from last_exception