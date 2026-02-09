#!/usr/bin/env python3
"""
LLM 파싱 결과를 PostgreSQL에 저장
- job_posting_embeddings_*.json 로드
- job_posting_parsed 테이블에 INSERT
"""

import os
import json
import glob
import hashlib
import psycopg2
from dotenv import load_dotenv
from datetime import datetime

load_dotenv(".env.prod")


def get_db_connection():
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        database=os.getenv('POSTGRES_DB', 'portmatch'),
        user=os.getenv('POSTGRES_USER', 'port'),
        password=os.getenv('POSTGRES_PASSWORD', 'match'),
        port=os.getenv('DB_PORT', '5432')
    )


def create_table_if_not_exists(cur):
    """테이블 생성 (없으면)"""
    cur.execute("""
        CREATE TABLE IF NOT EXISTS job_posting_parsed (
            id BIGSERIAL PRIMARY KEY,
            job_posting_id BIGINT NOT NULL UNIQUE,
            name VARCHAR(500),
            domain VARCHAR(100),
            problem TEXT,
            solution TEXT,
            tech TEXT,
            architecture_experience TEXT,
            keywords TEXT,
            content TEXT,
            content_hash VARCHAR(64),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_job_posting_parsed_job_posting_id 
        ON job_posting_parsed(job_posting_id);
    """)


def compute_content_hash(content):
    """콘텐츠 해시 생성"""
    if not content:
        return None
    return hashlib.sha256(content.encode('utf-8')).hexdigest()


def save_to_db():
    """파싱 결과를 DB에 저장"""
    
    # 1. 최신 파싱 결과 파일 찾기
    json_files = glob.glob("job_posting_embeddings_*.json")
    if not json_files:
        print("⚠️ 저장할 파싱 결과 파일이 없습니다.")
        return
    
    latest_file = sorted(json_files)[-1]
    print(f"📦 파싱 결과 로드: {latest_file}")
    
    with open(latest_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    results = data.get('results', [])
    print(f"📊 총 {len(results)}개 파싱 결과\n")
    
    # 2. DB 연결
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # 테이블 생성
        create_table_if_not_exists(cur)
        conn.commit()
        
        success_count = 0
        skip_count = 0
        fail_count = 0
        
        print("💾 DB 저장 시작...\n")
        
        for idx, item in enumerate(results, 1):
            job_posting_id = item.get('job_posting_id')
            parsed = item.get('parsed', {})
            
            if not job_posting_id:
                fail_count += 1
                continue
            
            # 실제 job_postings 테이블에 해당 ID가 있는지 확인
            cur.execute("SELECT id FROM job_postings WHERE id = %s", (job_posting_id,))
            if not cur.fetchone():
                # 크롤링된 원티드 ID와 DB ID가 다를 수 있음
                # title + company로 매칭 시도
                title = item.get('title')
                company_name = item.get('company_name')
                
                cur.execute("""
                    SELECT jp.id FROM job_postings jp
                    JOIN companies c ON jp.cid = c.cid
                    WHERE jp.title = %s AND c.companies_name = %s
                    LIMIT 1
                """, (title, company_name))
                
                row = cur.fetchone()
                if row:
                    job_posting_id = row[0]
                else:
                    print(f"  [{idx}] ⚠️ 매칭 실패: {title[:30]}... - {company_name}")
                    fail_count += 1
                    continue
            
            # 중복 체크
            cur.execute("""
                SELECT id, content_hash FROM job_posting_parsed 
                WHERE job_posting_id = %s
            """, (job_posting_id,))
            
            existing = cur.fetchone()
            content = json.dumps(parsed, ensure_ascii=False)
            content_hash = compute_content_hash(content)
            
            if existing:
                # 이미 존재하고 내용도 같으면 스킵
                if existing[1] == content_hash:
                    skip_count += 1
                    continue
                # 내용이 다르면 업데이트
                cur.execute("""
                    UPDATE job_posting_parsed SET
                        name = %s,
                        domain = %s,
                        problem = %s,
                        solution = %s,
                        tech = %s,
                        architecture_experience = %s,
                        keywords = %s,
                        content = %s,
                        content_hash = %s,
                        updated_at = NOW()
                    WHERE job_posting_id = %s
                """, (
                    parsed.get('name'),
                    parsed.get('domain'),
                    parsed.get('problem'),
                    parsed.get('solution'),
                    json.dumps(parsed.get('tech', []), ensure_ascii=False),
                    json.dumps(parsed.get('architecture_experience', []), ensure_ascii=False),
                    json.dumps(parsed.get('keywords', []), ensure_ascii=False),
                    content,
                    content_hash,
                    job_posting_id
                ))
                print(f"  [{idx}] 🔄 업데이트: {item.get('title', '')[:40]}")
            else:
                # 새로 삽입
                cur.execute("""
                    INSERT INTO job_posting_parsed 
                    (job_posting_id, name, domain, problem, solution, tech, 
                     architecture_experience, keywords, content, content_hash)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    job_posting_id,
                    parsed.get('name'),
                    parsed.get('domain'),
                    parsed.get('problem'),
                    parsed.get('solution'),
                    json.dumps(parsed.get('tech', []), ensure_ascii=False),
                    json.dumps(parsed.get('architecture_experience', []), ensure_ascii=False),
                    json.dumps(parsed.get('keywords', []), ensure_ascii=False),
                    content,
                    content_hash
                ))
                print(f"  [{idx}] ✅ 저장: {item.get('title', '')[:40]}")
            
            success_count += 1
        
        conn.commit()
        
        print("\n" + "=" * 60)
        print("✅ DB 저장 완료!")
        print("=" * 60)
        print(f"📊 전체: {len(results)}개")
        print(f"✅ 성공: {success_count}개")
        print(f"⏭️ 스킵: {skip_count}개")
        print(f"❌ 실패: {fail_count}개")
        print("=" * 60)
        
    except Exception as e:
        conn.rollback()
        print(f"❌ DB 저장 실패: {e}")
        import traceback
        traceback.print_exc()
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    save_to_db()
