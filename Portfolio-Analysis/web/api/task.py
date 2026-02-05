import json
import asyncio
from .celery_app import celery_app
from .routes.embeddings import _gemini_embed_documents, render_project_text, sha256_hex
from .chains.project_summary import build_project_summary_chain
from .chains.text_extraction import TEXT_EXTRACTION_CHAIN
from .chains.project_feedback import build_project_feedback_chain
from .services.mineru_client import fetch_mineru_content


# ==================== 임베딩 Task ====================
@celery_app.task(name='tasks.create_embeddings', bind=True)
def create_embeddings_task(self, projects: list, model: str = "gemini-embedding-001"):
    """
    포트폴리오 프로젝트 임베딩 생성 (비동기)
    """
    try:
        texts = []
        hashes = []
        
        for p in projects:
            if not isinstance(p, dict):
                text = ""
            else:
                text = render_project_text(p)
            texts.append(text)
            hashes.append(sha256_hex(text))
        
        vectors = _gemini_embed_documents(texts=texts, model=model)
        
        return {
            "model": model,
            "dim": len(vectors[0]) if vectors else None,
            "embeddings": [
                {"index": i, "content_hash": hashes[i], "embedding": vectors[i]}
                for i in range(len(vectors))
            ],
        }
    
    except Exception as exc:
        self.retry(exc=exc, countdown=60, max_retries=3)


# ==================== PDF 파싱 Task ====================
@celery_app.task(name='tasks.parse_pdf', bind=True)
def parse_pdf_task(self, s3_url: str):
    """
    PDF 파싱 + LLM 요약 (비동기)
    """
    try:
        # ✅ asyncio.run() 사용 (더 안전)
        content_type, content = asyncio.run(
            fetch_mineru_content(s3_url)
        )
        
        if "application/json" not in content_type:
            raise ValueError(f"Unexpected content type: {content_type}")
        
        mineru_data = json.loads(content)
        texts = TEXT_EXTRACTION_CHAIN.invoke(mineru_data)
        content_text = "\n".join(texts)
        
        summary_chain = build_project_summary_chain()
        projects = summary_chain.invoke({"content": content_text})
        
        return {"projects": projects}
    
    except Exception as exc:
        self.retry(exc=exc, countdown=60, max_retries=3)


# ==================== PDF 파싱 v2 Task ====================
@celery_app.task(name='tasks.parse_pdf_v2', bind=True)
def parse_pdf_v2_task(self, s3_url: str):
    """
    PDF 파싱 + 피드백 생성 (비동기)
    """
    try:
        content_type, content = asyncio.run(
            fetch_mineru_content(s3_url)
        )
        
        if "application/json" not in content_type:
            raise ValueError(f"Unexpected content type: {content_type}")
        
        mineru_data = json.loads(content)
        texts = TEXT_EXTRACTION_CHAIN.invoke(mineru_data)
        content_text = "\n".join(texts)
        
        feedback_chain = build_project_feedback_chain()
        result = feedback_chain.invoke({"content": content_text})
        
        return result
    
    except Exception as exc:
        self.retry(exc=exc, countdown=60, max_retries=3)

