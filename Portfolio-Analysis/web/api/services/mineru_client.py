import asyncio
import logging
import os
import tempfile

import httpx
import redis.asyncio as redis
from fastapi import HTTPException

from ..config import (
    HTTP_TIMEOUT,
    MINERU_ENDPOINTS,
    MINERU_FORM_DATA,
    MINERU_SEMAPHORE_KEY,
    MINERU_SEMAPHORE_WAIT_SECONDS,
    REDIS_HOST,
    REDIS_PORT,
)

logger = logging.getLogger(__name__)
_redis_client: redis.Redis | None = None
_semaphore_init_lock = asyncio.Lock()
_SEMAPHORE_META_SUFFIX = ":meta"

_SEMAPHORE_INIT_LUA = """
if redis.call('EXISTS', KEYS[1]) == 0 then
  for i = 2, #ARGV do
    redis.call('LPUSH', KEYS[1], ARGV[i])
  end
  return 1
end
return 0
"""

def _get_redis_client() -> redis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
    return _redis_client


async def _ensure_semaphore_initialized(client: redis.Redis) -> None:
    async with _semaphore_init_lock:
        try:
            if not MINERU_ENDPOINTS:
                return

            meta_key = f"{MINERU_SEMAPHORE_KEY}{_SEMAPHORE_META_SUFFIX}"
            current_signature = ",".join(MINERU_ENDPOINTS)
            stored_signature = await client.get(meta_key)

            if stored_signature != current_signature:
                await client.delete(MINERU_SEMAPHORE_KEY)
                await client.set(meta_key, current_signature)

            await client.eval(
                _SEMAPHORE_INIT_LUA,
                1,
                MINERU_SEMAPHORE_KEY,
                len(MINERU_ENDPOINTS),
                *MINERU_ENDPOINTS,
            )
        except Exception:
            logger.exception("Failed to initialize Mineru semaphore key. key=%s", MINERU_SEMAPHORE_KEY)
            raise


async def _acquire_endpoint(client: redis.Redis) -> str:
    await _ensure_semaphore_initialized(client)
    logger.info(
        "Waiting for Mineru endpoint token. key=%s timeout=%ss",
        MINERU_SEMAPHORE_KEY,
        MINERU_SEMAPHORE_WAIT_SECONDS,
    )
    result = await client.blpop(MINERU_SEMAPHORE_KEY, timeout=MINERU_SEMAPHORE_WAIT_SECONDS)
    if result is None:
        logger.error(
            "Mineru endpoint wait timeout. key=%s timeout=%ss",
            MINERU_SEMAPHORE_KEY,
            MINERU_SEMAPHORE_WAIT_SECONDS,
        )
        raise HTTPException(status_code=503, detail="mineru endpoint wait timeout")
    _, endpoint = result
    logger.info("Acquired Mineru endpoint token. key=%s endpoint=%s", MINERU_SEMAPHORE_KEY, endpoint)
    return endpoint


async def _release_endpoint(client: redis.Redis, endpoint: str) -> None:
    try:
        await client.lpush(MINERU_SEMAPHORE_KEY, endpoint)
        logger.info("Released Mineru endpoint token. key=%s endpoint=%s", MINERU_SEMAPHORE_KEY, endpoint)
    except Exception:
        logger.exception("Failed to release Mineru endpoint token. key=%s endpoint=%s", MINERU_SEMAPHORE_KEY, endpoint)


async def fetch_mineru_content(s3_url: str) -> tuple[str, bytes]:
    tmp_path = None
    logger.info(
        "Starting Mineru fetch. s3_url=%s endpoints=%s timeout=%s",
        s3_url,
        MINERU_ENDPOINTS,
        HTTP_TIMEOUT,
    )
    redis_client = _get_redis_client()
    endpoint: str | None = None
    try:
        if not MINERU_ENDPOINTS:
            logger.error("No Mineru endpoints configured.")
            raise HTTPException(status_code=500, detail="no mineru endpoints configured")

        endpoint = await _acquire_endpoint(redis_client)
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
                logger.info("Mineru request to %s", endpoint)
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
            except httpx.HTTPStatusError as exc:
                body_preview = exc.response.text[:500] if exc.response is not None else ""
                logger.error(
                    "Mineru returned error. endpoint=%s status=%s body_preview=%s",
                    endpoint,
                    exc.response.status_code if exc.response is not None else "unknown",
                    body_preview,
                )
                raise HTTPException(status_code=502, detail=f"mineru request failed: {exc}") from exc
            except httpx.HTTPError as exc:
                logger.error("Mineru request failed. endpoint=%s error=%s", endpoint, exc)
                raise HTTPException(status_code=502, detail=f"mineru request failed: {exc}") from exc
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
    finally:
        if endpoint is not None:
            await _release_endpoint(redis_client, endpoint)

    content_type = resp.headers.get("content-type", "application/json") if resp is not None else "application/json"
    return content_type, resp.content
