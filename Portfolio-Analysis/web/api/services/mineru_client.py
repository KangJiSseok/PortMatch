import asyncio
import os
import tempfile

import httpx
from fastapi import HTTPException

from ..config import HTTP_TIMEOUT, MINERU_ENDPOINTS, MINERU_FORM_DATA

_rr_lock = asyncio.Lock()
_rr_index = 0


async def _select_mineru_endpoint() -> str:
    if len(MINERU_ENDPOINTS) == 1:
        return MINERU_ENDPOINTS[0]

    global _rr_index
    async with _rr_lock:
        _rr_index = (_rr_index + 1) % len(MINERU_ENDPOINTS)
        return MINERU_ENDPOINTS[_rr_index]


async def fetch_mineru_content(s3_url: str) -> tuple[str, bytes]:
    tmp_path = None
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

        try:
            with open(tmp_path, "rb") as pdf_file:
                files = {"files": ("document.pdf", pdf_file, "application/pdf")}
                endpoint = await _select_mineru_endpoint()
                resp = await client.post(endpoint, files=files, data=MINERU_FORM_DATA)
                resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail=f"mineru request failed: {exc}") from exc
        finally:
            if tmp_path:
                try:
                    os.remove(tmp_path)
                except OSError:
                    pass

    content_type = resp.headers.get("content-type", "application/json")
    return content_type, resp.content
