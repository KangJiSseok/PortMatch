import os
import json
import glob
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

# 1. 환경 변수 로드 (.env.prod 파일 읽기)
load_dotenv(".env.prod")

def get_db_connection():
    """DB 연결 설정"""
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        database=os.getenv("DB_NAME", "wanted_db"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "password"),
        port=os.getenv("DB_PORT", "5432")
    )

def insert_to_db():
    # 최신 JSON 파일 찾기 (full 데이터 파일 기준)
    json_files = glob.glob("wanted_crawl_full_*.json")
    if not json_files:
        print("⚠️ 적재할 JSON 파일이 없습니다.")
        return

    latest_file = max(json_files) # 가장 최근 파일 선택
    print(f"📦 최신 데이터 로드 중: {latest_file}")

    with open(latest_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # 2. 회사(Companies) 정보 먼저 저장 (FK 제약 조건 때문)
        print("🏢 회사 정보 적재 시작...")
        for job in data['jobPostings']:
            company = job['company']
            cur.execute("""
                INSERT INTO companies (cid, name, address, size, homepage_url, logo)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (cid) DO UPDATE SET
                    name = EXCLUDED.name,
                    address = EXCLUDED.address,
                    size = EXCLUDED.size,
                    homepage_url = EXCLUDED.homepage_url,
                    logo = EXCLUDED.logo;
            """, (
                company['cid'], company['companiesName'], company['address'],
                company['size'], company['homepageUrl'], company['logo']
            ))

        # 3. 채용 공고(Job Postings) 정보 저장
        print("📝 채용 공고 적재 시작...")
        for job in data['jobPostings']:
            cur.execute("""
                INSERT INTO job_postings (job_id, title, active, detail, cid, start_date, end_date)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (job_id) DO NOTHING;  -- 이미 있는 공고는 스킵
            """, (
                job['id'], job['title'], job['active'], job['detail'],
                job['cid'], job['startDate'], job['endDate']
            ))

        conn.commit()
        print(f"✅ DB 적재 완료! (파일: {latest_file})")

    except Exception as e:
        conn.rollback()
        print(f"❌ DB 적재 실패: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    insert_to_db()