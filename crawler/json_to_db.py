import os
import json
import glob
import psycopg2
from dotenv import load_dotenv

load_dotenv(".env.prod")

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        database=os.getenv('POSTGRES_DB', 'portmatch'),
        user=os.getenv('POSTGRES_USER', 'port'),
        password=os.getenv('POSTGRES_PASSWORD', 'match'),
        port=os.getenv('DB_PORT', '5432')
    )

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

        # 3. 회사 정보 적재
        print("🏢 회사 정보 체크 및 적재...")
        company_id_map = {} 
        for company in data.get('companies', []):
            c_name = company['companiesName']
            
            # 우선 INSERT 시도 (이름이 같으면 아무것도 안 함)
            cur.execute("""
                INSERT INTO companies (cid, companies_name, address, size, homepage_url, logo)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (companies_name) DO NOTHING;
            """, (company['cid'], c_name, company.get('address'), company.get('size'), company.get('homepageUrl'), company.get('logo')))
            
            # 실제 DB에 있는 cid를 가져와서 맵에 저장 (기존 기업이든 신규든 상관없이)
            cur.execute("SELECT cid FROM companies WHERE companies_name = %s", (c_name,))
            company_id_map[c_name] = cur.fetchone()[0]

        # 4. 채용 공고 적재
        print("📝 채용 공고 적재 시작...")
        for job in data.get('jobPostings', []):
            target_cid = company_id_map.get(job['company']['companiesName'])

            # 제목+회사가 같으면 중복으로 판단하고 DO NOTHING
            # 만약 업데이트를 하고 싶다면 DO UPDATE SET ... 으로 변경 가능!
            cur.execute("""
                INSERT INTO job_postings (title, active, start_date, end_date, vcnt, cid, detail, job_type)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (title, cid) DO NOTHING
                RETURNING id;
            """, (job['title'], job['active'], job['startDate'], job['endDate'], 0, target_cid, job['detail'], 1))
            
            result = cur.fetchone()
            
            if result:
                new_job_id = result[0]
                # 5. 공고-스택 연결 (새로 등록된 공고일 때만 연결)
                for stack in job.get('skillTags', []):
                    cur.execute("""
                        INSERT INTO posting_stacks (job_posting_id, stack_id)
                        VALUES (%s, %s) ON CONFLICT DO NOTHING;
                    """, (new_job_id, stack['id']))
            else:
                # 이미 있는 공고는 스킵 (혹은 여기서 기존 ID를 SELECT해서 스택만 업데이트할 수도 있어!)
                continue

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