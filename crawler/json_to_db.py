import os
import json
import glob
import psycopg2
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone

load_dotenv(".env.prod")

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        database=os.getenv('POSTGRES_DB', 'portmatch'),
        user=os.getenv('POSTGRES_USER', 'port'),
        password=os.getenv('POSTGRES_PASSWORD', 'match'),
        port=os.getenv('DB_PORT', '5432')
    )

def truncate(value, max_len):
    """DB 컬럼 길이 제한에 맞게 truncate"""
    if value is None:
        return None
    return value[:max_len] if len(value) > max_len else value

def insert_to_db():
    # 1. 수정 포인트: 전처리된 최종 파일을 읽어야 함!
    json_files = glob.glob("db_ready_data_*.json")
    if not json_files:
        print("⚠️ 적재할 전처리 JSON 파일이 없습니다.")
        return

    latest_file = max(json_files)
    print(f"📦 전처리 완료 데이터 로드: {latest_file}")

    with open(latest_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute("SELECT setval(pg_get_serial_sequence('job_postings', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM job_postings;")

        # 3. 회사 정보 적재 (엔티티 컬럼명 companies_name 등 반영)
        print("🏢 회사 정보 체크 및 적재...")
        # 이름 매칭 로직으로 가입 기업의 cid를 보존함
        company_id_map = {}
        for company in data.get('companies', []):
            c_name = company['companiesName']
            cur.execute("SELECT cid FROM companies WHERE companies_name = %s", (c_name,))
            existing = cur.fetchone()

            if existing:
                target_cid = existing[0]
            else:
                target_cid = company['cid']
                cur.execute("""
                    INSERT INTO companies (cid, companies_name, address, size, homepage_url, logo, busi_cont, tot_psncnt)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (cid) DO NOTHING;
                """, (
                    target_cid,
                    truncate(c_name, 255),
                    truncate(company.get('address'), 500),
                    truncate(company.get('size'), 100),
                    truncate(company.get('homepageUrl'), 500),
                    truncate(company.get('logo'), 500),
                    truncate(company.get('busiCont'), 5000),
                    truncate(company.get('totPsncnt'), 50)
                ))

            company_id_map[c_name] = target_cid

        # 4. 채용 공고 적재 (제목+cid로 중복 체크하여 찜하기 보호)
        print("📝 채용 공고 적재 시작...")
        for job in data.get('jobPostings', []):
            target_cid = company_id_map.get(job['company']['companiesName'])

            cur.execute("""
                SELECT id FROM job_postings WHERE title = %s AND cid = %s;
            """, (job['title'], target_cid))

            if cur.fetchone():
                continue # 이미 있으면 스킵

            kst_now = datetime.now(timezone(timedelta(hours=9)))
            kst_today_str = kst_now.strftime('%Y-%m-%d')


            cur.execute("""
                INSERT INTO job_postings (title, active, start_date, end_date, vcnt, cid, detail, job_type)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id;
            """, (
                job['title'],
                job['active'],
                kst_today_str,
                job['endDate'],
                0,
                target_cid,
                job['detail'],
                1
            ))

            new_job_id = cur.fetchone()[0]

            # 5. 공고-스택 연결 (중간 테이블)
            for stack in job.get('skillTags', []):
                cur.execute("""
                    INSERT INTO posting_stacks (job_posting_id, stack_id)
                    VALUES (%s, %s) ON CONFLICT DO NOTHING;
                """, (new_job_id, stack['id']))

        conn.commit()
        print(f"✅ 모든 데이터가 엔티티 구조에 맞춰 적재되었습니다!")

    except Exception as e:
        conn.rollback()
        print(f"❌ DB 적재 실패: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    insert_to_db()
