import asyncio
import logging
import os
import tempfile

import httpx
from fastapi import HTTPException

from ..config import HTTP_TIMEOUT, MINERU_ENDPOINTS, MINERU_FORM_DATA

_rr_lock = asyncio.Lock()
_rr_index = 0
logger = logging.getLogger(__name__)


async def _endpoint_order() -> list[str]:
    if not MINERU_ENDPOINTS:
        return []
    if len(MINERU_ENDPOINTS) == 1:
        return [MINERU_ENDPOINTS[0]]

    global _rr_index
    async with _rr_lock:
        _rr_index = (_rr_index + 1) % len(MINERU_ENDPOINTS)
        start = _rr_index

    return [
        MINERU_ENDPOINTS[(start + offset) % len(MINERU_ENDPOINTS)]
        for offset in range(len(MINERU_ENDPOINTS))
    ]


async def fetch_mineru_content(s3_url: str) -> tuple[str, bytes]:
    tmp_path = None
    endpoints = await _endpoint_order()
    logger.info(
        "Starting Mineru fetch. s3_url=%s endpoints=%s timeout=%s",
        s3_url,
        endpoints,
        HTTP_TIMEOUT,
    )
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        try:
            async with client.stream("GET", str(s3_url), follow_redirects=True) as download:
                download.raise_for_status()
                with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp_file:
                    tmp_path = tmp_file.name
                    total_bytes = 0
                    async for chunk in download.aiter_bytes():
                        tmp_file.write(chunk)
                        total_bytes += len(chunk)
            logger.info("Downloaded s3 file to %s (bytes=%s)", tmp_path, total_bytes)
        except httpx.HTTPError as exc:
            logger.exception("Failed to download s3 file. s3_url=%s", s3_url)
            raise HTTPException(status_code=502, detail=f"failed to download s3 file: {exc}") from exc

        try:
            if not endpoints:
                logger.error("No Mineru endpoints configured.")
                raise HTTPException(status_code=500, detail="no mineru endpoints configured")

            last_exc: httpx.HTTPError | None = None
            resp: httpx.Response | None = None
            for attempt, endpoint in enumerate(endpoints, start=1):
                logger.info("Mineru request attempt %s/%s to %s", attempt, len(endpoints), endpoint)
                try:
                    with open(tmp_path, "rb") as pdf_file:
                        files = {"files": ("document.pdf", pdf_file, "application/pdf")}
                        resp = await client.post(endpoint, files=files, data=MINERU_FORM_DATA)
                        resp.raise_for_status()
                    logger.info(
                        "Mineru request succeeded. endpoint=%s status=%s bytes=%s",
                        endpoint,
                        resp.status_code,
                        len(resp.content),
                    )
                    break
                except httpx.HTTPStatusError as exc:
                    last_exc = exc
                    body_preview = exc.response.text[:500] if exc.response is not None else ""
                    logger.error(
                        "Mineru returned error. endpoint=%s status=%s body_preview=%s",
                        endpoint,
                        exc.response.status_code if exc.response is not None else "unknown",
                        body_preview,
                    )
                except httpx.HTTPError as exc:
                    last_exc = exc
                    logger.error("Mineru request failed. endpoint=%s error=%s", endpoint, exc)

            if resp is None:
                logger.error("All Mineru endpoints failed. endpoints=%s", endpoints)
                raise HTTPException(
                    status_code=502,
                    detail=f"mineru request failed: {last_exc}",
                ) from last_exc
        except HTTPException:
            raise
        except Exception as exc:
            logger.exception("Unexpected Mineru failure.")
            raise HTTPException(status_code=502, detail=f"mineru request failed: {exc}") from exc
        finally:
            if tmp_path:
                try:
                    os.remove(tmp_path)
                except OSError:
                    pass

    content_type = resp.headers.get("content-type", "application/json") if resp is not None else "application/json"
    return content_type, resp.content
