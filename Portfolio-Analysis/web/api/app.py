from fastapi import FastAPI, HTTPException, Response, Request
import httpx
import json
import os
import tempfile

app = FastAPI()

MINERU_ENDPOINT = "http://localhost:18000/file_parse"
HTTP_TIMEOUT = httpx.Timeout(60.0, connect=10.0)


@app.post("/api/parse")
async def parse_pdf(request: Request):
    raw_body = await request.body()
    if raw_body:
        preview = raw_body[:500]
        print(f"parse request raw body (first 500 bytes)={preview}")
    else:
        print("parse request raw body is empty")

    data = None
    if raw_body:
        try:
            data = json.loads(raw_body)
        except json.JSONDecodeError:
            data = None

    s3_url = None
    if isinstance(data, dict):
        s3_url = data.get("s3_url")

    if not s3_url:
        raise HTTPException(status_code=400, detail="s3_url is required")

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
            print(f"failed to download s3 file: {exc}")
            raise HTTPException(status_code=502, detail=f"failed to download s3 file: {exc}") from exc

        try:
            with open(tmp_path, "rb") as pdf_file:
                files = {"files": ("document.pdf", pdf_file, "application/pdf")}
                data = {
                    "return_content_list": "true",
                    "return_middle_json": "false",
                    "lang_list": "korean",
                    "backend": "pipeline",
                    "return_images": "false",
                    "return_md": "false",
                    "response_format_zip": "false",
                }
                resp = await client.post(MINERU_ENDPOINT, files=files, data=data)
                resp.raise_for_status()
        except httpx.HTTPError as exc:
            print(f"mineru request failed: {exc}")
            raise HTTPException(status_code=502, detail=f"mineru request failed: {exc}") from exc
        finally:
            if tmp_path:
                try:
                    os.remove(tmp_path)
                except OSError:
                    pass

    content_type = resp.headers.get("content-type", "application/json")
    if "application/json" in content_type:
        return resp.json()
    return Response(content=resp.content, media_type=content_type)
