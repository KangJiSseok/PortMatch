import json
import asyncio
import os
import redis
from .celery_app import celery_app
from .routes.embeddings import _gemini_embed_documents, render_project_text, sha256_hex
from .chains.project_summary import build_project_summary_chain
from .chains.text_extraction import TEXT_EXTRACTION_CHAIN
from .chains.project_feedback import build_project_feedback_chain
from .services.mineru_client import fetch_mineru_content


# ==================== Redis 연결 ====================
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "127.0.0.1"),
    port=int(os.getenv("REDIS_PORT", 8379)),
    password=os.getenv("REDIS_PASSWORD")
)


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


# ==================== PDF 파싱 Task (포트 큐 방식) ====================
@celery_app.task(name='tasks.parse_pdf', bind=True)
def parse_pdf_task(self, s3_url: str):
    """
    PDF 파싱 + LLM 요약 (Redis Queue 기반 병렬 처리)
    """
    port = None
    try:
        # 1. Redis에서 사용 가능한 포트 획득 (블로킹)
        port_data = redis_client.blpop("available_mineru_ports", timeout=600)
        
        if not port_data:
            raise Exception("사용 가능한 MinerU 포트가 없습니다 (Timeout 600초)")
        
        # port_data는 (key, value) 튜플이므로 [1]로 값 추출
        port = port_data[1].decode('utf-8')
        print(f"✅ 포트 획득: {port}")
        
        # 2. 획득한 포트로 MinerU 호출
        content_type, content = asyncio.run(
            fetch_mineru_content(s3_url, port=port)
        )
        
        if "application/json" not in content_type:
            raise ValueError(f"Unexpected content type: {content_type}")
        
        # 3. 데이터 가공 및 LLM 처리
        mineru_data = json.loads(content)
        texts = TEXT_EXTRACTION_CHAIN.invoke(mineru_data)
        content_text = "\n".join(texts)
        
        summary_chain = build_project_summary_chain()
        projects = summary_chain.invoke({"content": content_text})
        
        return {"projects": projects}
    
    except Exception as exc:
        self.retry(exc=exc, countdown=60, max_retries=3)
    
    finally:
        # 4. 중요! 성공/실패 상관없이 포트 반납
        if port:
            try:
                redis_client.rpush("available_mineru_ports", port)
                print(f"✅ 포트 반납: {port}")
            except Exception as e:
                print(f"❌ 포트 반납 실패: {port} - {e}")


# ==================== PDF 파싱 v2 Task (포트 큐 방식) ====================
@celery_app.task(name='tasks.parse_pdf_v2', bind=True)
def parse_pdf_v2_task(self, s3_url: str):
    """
    PDF 파싱 + 피드백 생성 (Redis Queue 기반 병렬 처리)
    """
    port = None
    try:
        # 1. Redis에서 사용 가능한 포트 획득 (블로킹)
        port_data = redis_client.blpop("available_mineru_ports", timeout=600)
        
        if not port_data:
            raise Exception("사용 가능한 MinerU 포트가 없습니다 (Timeout 600초)")
        
        port = port_data[1].decode('utf-8')
        print(f"✅ 포트 획득: {port}")
        
        # 2. 획득한 포트로 MinerU 호출
        content_type, content = asyncio.run(
            fetch_mineru_content(s3_url, port=port)
        )
        
        if "application/json" not in content_type:
            raise ValueError(f"Unexpected content type: {content_type}")
        
        # 3. 데이터 가공 및 LLM 처리
        mineru_data = json.loads(content)
        texts = TEXT_EXTRACTION_CHAIN.invoke(mineru_data)
        content_text = "\n".join(texts)
        
        feedback_chain = build_project_feedback_chain()
        result = feedback_chain.invoke({"content": content_text})
        
        return result
    
    except Exception as exc:
        self.retry(exc=exc, countdown=60, max_retries=3)
    
    finally:
        # 4. 중요! 성공/실패 상관없이 포트 반납
        if port:
            try:
                redis_client.rpush("available_mineru_ports", port)
                print(f"✅ 포트 반납: {port}")
            except Exception as e:
                print(f"❌ 포트 반납 실패: {port} - {e}")