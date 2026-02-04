import os
import json
import glob
import psycopg2
import requests
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone

load_dotenv(".env.prod")

# Spring API URL
SPRING_API_URL = os.getenv('SPRING_API_URL', 'http://portmatch-backend-prod:8080')

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'db'),
        database=os.getenv('POSTGRES_DB', 'portmatch'),
        user=os.getenv('POSTGRES_USER', 'portmatch'),
        password=os.getenv('POSTGRES_PASSWORD', 'portmatch'),
        port=os.getenv('DB_PORT', '5432')
    )

def truncate(value, max_len):
    """DB 컬럼 길이 제한에 맞게 truncate"""
    if value is None:
        return None
    return value[:max_len] if len(value) > max_len else value

def check_company_project_exists(cur, company_name):
    """회사 이름을 가지고 embeddings 테이블에 데이터가 있는지 확인"""
    cur.execute("""
        SELECT EXISTS(
            SELECT 1 
            FROM company_project_embeddings e
            JOIN companies c ON e.company_id = c.id
            WHERE c.companies_name = %s
        )
    """, (company_name,))
    return cur.fetchone()[0]

def request_company_analysis(company_name):
    url = f"{SPRING_API_URL}/api/company-projects/analysis"
    
    # ✅ 최종 확인: 자바 DTO의 @JsonProperty("company_name")와 완벽 일치!
    payload = {
        "company_name": [company_name]
    }
    
    try:
        # flush=True를 써서 로그가 즉시 터미널에 찍히게 함
        print(f"    🔍 회사 프로젝트 분석 요청: {company_name}", flush=True)
        
        response = requests.post(
            url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=180  # AI 분석이 오래 걸릴 수 있으니 넉넉하게 3분!
        )
        
        if response.status_code == 200:
            print(f"    ✅ 분석 완료: {company_name}", flush=True)
            print(f"DEBUG RESPONSE: {response.json()}", flush=True)
            return True
        else:
            print(f"    ⚠️  분석 실패 [{response.status_code}]: {company_name}", flush=True)
            # 만약 실패하면 백엔드 로그를 봐야 하니까 응답 내용도 찍어줘
            print(f"    DEBUG ERROR BODY: {response.text}", flush=True)
            return False
    except Exception as e:
        print(f"    ❌ API 요청 실패: {e}", flush=True)
        return False

def insert_to_db():
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

    analysis_stats = {"total": 0, "exists": 0, "requested": 0, "success": 0, "failed": 0}

    try:
        cur.execute("SELECT setval(pg_get_serial_sequence('job_postings', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM job_postings;")

        print("\n" + "=" * 60)
        print("🏢 회사 정보 체크 및 적재...")
        print("=" * 60)
        
        company_id_map = {}
        for idx, company in enumerate(data.get('companies', []), 1):
            c_name = company['companiesName']
            analysis_stats["total"] += 1
            
            print(f"\n[{idx}/{len(data.get('companies', []))}] {c_name}")
            
            cur.execute("SELECT cid FROM companies WHERE companies_name = %s", (c_name,))
            existing = cur.fetchone()

            if existing:
                target_cid = existing[0]
                print(f"  ✅ 기존 회사 (CID: {target_cid})")
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
                print(f"  🆕 신규 회사 (CID: {target_cid})")

            company_id_map[c_name] = target_cid
            conn.commit()
            
            # ✅ 분석 요청 (필드명 수정된 함수 호출)
            if check_company_project_exists(cur, c_name):
                print(f"  📊 프로젝트 분석: 이미 존재")
                analysis_stats["exists"] += 1
            else:
                print(f"  📊 프로젝트 분석: 없음 → API 요청")
                analysis_stats["requested"] += 1
                if request_company_analysis(c_name):
                    analysis_stats["success"] += 1
                else:
                    analysis_stats["failed"] += 1
            conn.commit()

        print("\n" + "=" * 60)
        print("📝 채용 공고 적재 시작...")
        print("=" * 60)
        
        job_stats = {"total": 0, "inserted": 0, "skipped": 0}
        for job in data.get('jobPostings', []):
            job_stats["total"] += 1
            target_cid = company_id_map.get(job['company']['companiesName'])

            cur.execute("SELECT id FROM job_postings WHERE title = %s AND cid = %s;", (job['title'], target_cid))
            if cur.fetchone():
                job_stats["skipped"] += 1
                continue

            kst_now = datetime.now(timezone(timedelta(hours=9)))
            kst_today_str = kst_now.strftime('%Y-%m-%d')

            cur.execute("""
                INSERT INTO job_postings (title, active, start_date, end_date, vcnt, cid, detail, job_type)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id;
            """, (job['title'], job['active'], kst_today_str, job['endDate'], 0, target_cid, job['detail'], 1))

            new_job_id = cur.fetchone()[0]
            job_stats["inserted"] += 1

            for stack in job.get('skillTags', []):
                cur.execute("""
                    INSERT INTO posting_stacks (job_posting_id, stack_id)
                    VALUES (%s, %s) ON CONFLICT DO NOTHING;
                """, (new_job_id, stack['id']))

        conn.commit()
        
        print("\n" + "=" * 60)
        print("✅ 데이터 적재 완료!")
        print(f"📊 분석 성공: {analysis_stats['success']} / 실패: {analysis_stats['failed']}")
        print(f"📊 공고 추가: {job_stats['inserted']} / 중복: {job_stats['skipped']}")
        print("=" * 60)

    except Exception as e:
        conn.rollback()
        print(f"\n❌ DB 적재 실패: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    insert_to_db()