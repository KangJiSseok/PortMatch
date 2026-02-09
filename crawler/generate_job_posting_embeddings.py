#!/usr/bin/env python3
"""
채용공고 파싱 결과에서 임베딩 벡터를 생성하여 DB에 저장
Gemini API를 사용하여 각 필드별 임베딩 생성
"""

import os
import json
import hashlib
import requests
import psycopg2
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

# DB 설정
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("POSTGRES_DB", "portmatch")
DB_USER = os.getenv("POSTGRES_USER", "postgres")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "")

# Gemini 설정
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_BASE_URL = os.getenv("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com")
GEMINI_MODEL = os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")
OUTPUT_DIMENSIONS = int(os.getenv("GEMINI_OUTPUT_DIMENSIONS", "1536"))


def get_db_connection():
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )


def sha256_hex(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def normalize_model(model: str) -> str:
    if model.startswith("models/"):
        return model
    return f"models/{model}"


def gemini_embed_batch(texts: list[str]) -> list[list[float]]:
    """Gemini API로 배치 임베딩 생성"""
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not set")
    
    model_name = normalize_model(GEMINI_MODEL)
    url = f"{GEMINI_BASE_URL.rstrip('/')}/v1beta/{model_name}:batchEmbedContents"
    
    requests_payload = []
    for text in texts:
        req = {
            "model": model_name,
            "content": {"parts": [{"text": text}]},
        }
        if OUTPUT_DIMENSIONS:
            req["outputDimensionality"] = OUTPUT_DIMENSIONS
        requests_payload.append(req)
    
    payload = {"requests": requests_payload}
    headers = {"x-goog-api-key": GEMINI_API_KEY, "Content-Type": "application/json"}
    
    response = requests.post(url, json=payload, headers=headers, timeout=60)
    if response.status_code >= 400:
        raise RuntimeError(f"Gemini API error: {response.status_code} {response.text[:500]}")
    
    data = response.json()
    embeddings = data.get("embeddings", [])
    
    vectors = []
    for emb in embeddings:
        values = emb.get("values", [])
        vectors.append(values)
    
    return vectors


def build_field_text(label: str, value: str) -> str:
    """필드별 임베딩용 텍스트 생성 - 포트폴리오와 동일한 포맷 사용"""
    if not value or value.strip() == "":
        return f"[{label}] 정보 없음"
    return f"[{label}] {value.strip()}"


def to_vector_string(vector: list[float]) -> str:
    """벡터를 PostgreSQL vector 형식으로 변환"""
    return "[" + ",".join(str(v) for v in vector) + "]"


def process_job_postings():
    conn = get_db_connection()
    cur = conn.cursor()
    
    # 파싱된 공고 중 임베딩이 없는 것들 조회
    cur.execute("""
        SELECT jp.job_posting_id, jp.name, jp.domain, jp.problem, jp.solution, 
               jp.tech, jp.architecture_experience, jp.keywords, jp.content, jp.content_hash
        FROM job_posting_parsed jp
        LEFT JOIN job_posting_embeddings jpe ON jp.job_posting_id = jpe.job_posting_id
        WHERE jpe.id IS NULL OR jpe.content_hash != jp.content_hash
    """)
    
    rows = cur.fetchall()
    total = len(rows)
    
    if total == 0:
        print("✅ 모든 공고에 임베딩이 이미 생성되어 있습니다.")
        cur.close()
        conn.close()
        return
    
    print(f"📊 임베딩 생성 대상: {total}개 공고")
    
    # 배치 처리
    batch_size = 10
    success_count = 0
    error_count = 0
    
    for i in range(0, total, batch_size):
        batch = rows[i:i + batch_size]
        print(f"\n🔄 배치 {i // batch_size + 1}/{(total + batch_size - 1) // batch_size} 처리 중...")
        
        for row in batch:
            (job_posting_id, name, domain, problem, solution, 
             tech, architecture_experience, keywords, content, content_hash) = row
            
            try:
                # tech, architecture_experience, keywords는 JSON 문자열일 수 있음
                tech_list = []
                arch_list = []
                kw_list = []

                if isinstance(tech, str):
                    try:
                        tech_list = json.loads(tech)
                        tech_str = ", ".join(tech_list) if tech_list else "정보 없음"
                    except:
                        tech_str = tech
                elif isinstance(tech, list):
                    tech_list = tech
                    tech_str = ", ".join(tech)
                else:
                    tech_str = "정보 없음"
                
                if isinstance(architecture_experience, str):
                    try:
                        arch_list = json.loads(architecture_experience)
                        arch_str = "; ".join(arch_list) if arch_list else "정보 없음"
                    except:
                        arch_str = architecture_experience
                elif isinstance(architecture_experience, list):
                    arch_list = architecture_experience
                    arch_str = "; ".join(architecture_experience)
                else:
                    arch_str = "정보 없음"
                
                if isinstance(keywords, str):
                    try:
                        kw_list = json.loads(keywords)
                        kw_str = ", ".join(kw_list) if kw_list else "정보 없음"
                    except:
                        kw_str = keywords
                elif isinstance(keywords, list):
                    kw_list = keywords
                    kw_str = ", ".join(keywords)
                else:
                    kw_str = "정보 없음"
                
                # 각 필드별 텍스트 생성 (포트폴리오와 동일한 라벨 사용)
                texts = [
                    build_field_text("project", name or ""),  # name -> project 통일
                    build_field_text("domain", domain or ""),
                    build_field_text("problem", problem or ""),
                    build_field_text("solution", solution or ""),
                    build_field_text("tech", tech_str),
                    build_field_text("architecture", arch_str),
                    build_field_text("keywords", kw_str),
                ]
                
                # 임베딩 생성
                vectors = gemini_embed_batch(texts)
                
                if len(vectors) != 7:
                    raise ValueError(f"Expected 7 vectors, got {len(vectors)}")
                
                # missing 플래그
                problem_missing = not problem or problem.strip() == ""
                solution_missing = not solution or solution.strip() == ""
                tech_missing = len(tech_list) == 0
                arch_missing = len(arch_list) == 0
                keywords_missing = len(kw_list) == 0
                
                # DB에 저장 (upsert)
                cur.execute("""
                    INSERT INTO job_posting_embeddings 
                        (job_posting_id, name, domain, problem, solution, tech, 
                         architecture_experience, keywords, content, content_hash,
                         name_embedding, domain_embedding, problem_embedding, 
                         solution_embedding, tech_embedding, architecture_embedding, 
                         keywords_embedding, problem_missing, solution_missing, 
                         tech_missing, architecture_missing, created_at, updated_at)
                    VALUES 
                        (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                         %s::vector, %s::vector, %s::vector, %s::vector, 
                         %s::vector, %s::vector, %s::vector,
                         %s, %s, %s, %s, NOW(), NOW())
                    ON CONFLICT (job_posting_id) 
                    DO UPDATE SET
                        name = EXCLUDED.name,
                        domain = EXCLUDED.domain,
                        problem = EXCLUDED.problem,
                        solution = EXCLUDED.solution,
                        tech = EXCLUDED.tech,
                        architecture_experience = EXCLUDED.architecture_experience,
                        keywords = EXCLUDED.keywords,
                        content = EXCLUDED.content,
                        content_hash = EXCLUDED.content_hash,
                        name_embedding = EXCLUDED.name_embedding,
                        domain_embedding = EXCLUDED.domain_embedding,
                        problem_embedding = EXCLUDED.problem_embedding,
                        solution_embedding = EXCLUDED.solution_embedding,
                        tech_embedding = EXCLUDED.tech_embedding,
                        architecture_embedding = EXCLUDED.architecture_embedding,
                        keywords_embedding = EXCLUDED.keywords_embedding,
                        problem_missing = EXCLUDED.problem_missing,
                        solution_missing = EXCLUDED.solution_missing,
                        tech_missing = EXCLUDED.tech_missing,
                        architecture_missing = EXCLUDED.architecture_missing,
                        updated_at = NOW()
                """, (
                    job_posting_id, name, domain, problem, solution, 
                    json.dumps(tech_list, ensure_ascii=False),
                    json.dumps(arch_list, ensure_ascii=False),
                    json.dumps(kw_list, ensure_ascii=False),
                    content, content_hash,
                    to_vector_string(vectors[0]),  # name
                    to_vector_string(vectors[1]),  # domain
                    to_vector_string(vectors[2]),  # problem
                    to_vector_string(vectors[3]),  # solution
                    to_vector_string(vectors[4]),  # tech
                    to_vector_string(vectors[5]),  # architecture
                    to_vector_string(vectors[6]),  # keywords
                    problem_missing, solution_missing, tech_missing, arch_missing
                ))
                
                success_count += 1
                print(f"  ✅ [{success_count}/{total}] job_posting_id={job_posting_id}")
                
            except Exception as e:
                error_count += 1
                print(f"  ❌ job_posting_id={job_posting_id}: {e}")
        
        # 배치마다 커밋
        conn.commit()
    
    cur.close()
    conn.close()
    
    print(f"\n{'=' * 50}")
    print(f"✅ 완료: 성공 {success_count}건, 실패 {error_count}건")


if __name__ == "__main__":
    print("=" * 50)
    print(f"🚀 [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 공고 임베딩 생성 시작")
    print("=" * 50)
    process_job_postings()
