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
    if value is None: return None
    return value[:max_len] if len(value) > max_len else value

def check_company_project_exists(cur, company_name):
    """분석 결과가 이미 존재하는지 확인"""
    cur.execute("""
        SELECT EXISTS(
            SELECT 1 
            FROM company_project_analyses a
            JOIN companies c ON a.company_id = c.id
            WHERE c.companies_name = %s
        )
    """, (company_name,))
    return cur.fetchone()[0]

def request_embedding(analysis_id):
    """분석 ID 기반 임베딩 생성 요청"""
    url = f"{SPRING_API_URL}/api/company-projects/analysis/{analysis_id}/embeddings"
    try:
        print(f"    🧠 임베딩 생성 요청 (Analysis ID: {analysis_id})...", flush=True)
        response = requests.post(url, timeout=300)
        if response.status_code == 200:
            result = response.json()
            print(f"    ✅ 임베딩 저장 완료! (저장된 개수: {result.get('saved', 0)})", flush=True)
            return True
        else:
            print(f"    ⚠️ 임베딩 실패 [{response.status_code}]: {response.text}", flush=True)
            return False
    except Exception as e:
        print(f"    ❌ 임베딩 API 요청 중 오류: {e}", flush=True)
        return False

def request_company_analysis(cur, company_name):
    """회사 분석 요청 후 성공 시 임베딩 연쇄 호출"""
    url = f"{SPRING_API_URL}/api/company-projects/analysis"
    payload = {"company_name": [company_name]}
    try:
        print(f"    🔍 회사 프로젝트 분석 요청: {company_name}", flush=True)
        response = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=500)
        
        if response.status_code == 200:
            print(f"    ✅ 분석 요청 성공: {company_name}", flush=True)
            # 방금 생성된 analysis_id 조회 (연쇄 호출을 위해)
            cur.execute("""
                SELECT a.id FROM company_project_analyses a
                JOIN companies c ON a.company_id = c.id
                WHERE c.companies_name = %s
                ORDER BY a.created_at DESC LIMIT 1
            """, (company_name,))
            row = cur.fetchone()
            if row:
                return request_embedding(row[0]) # 임베딩 호출 결과 리턴
            return False
        else:
            print(f"    ⚠️ 분석 실패 [{response.status_code}]: {response.text}", flush=True)
            return False
    except Exception as e:
        print(f"    ❌ 분석 API 요청 중 오류: {e}", flush=True)
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
    job_stats = {"total": 0, "inserted": 0, "skipped": 0}
    company_id_map = {} # ✅ 루프 밖에서 초기화

    try:
        # 시퀀스 동기화
        cur.execute("SELECT setval(pg_get_serial_sequence('job_postings', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM job_postings;")

        print("\n" + "=" * 60 + "\n🏢 회사 정보 및 분석 처리\n" + "=" * 60)
        for idx, company in enumerate(data.get('companies', []), 1):
            c_name = company['companiesName']
            analysis_stats["total"] += 1
            print(f"\n[{idx}/{len(data.get('companies', []))}] {c_name}")
            
            # 회사 Insert/Select
            cur.execute("SELECT id, cid FROM companies WHERE companies_name = %s", (c_name,))
            existing = cur.fetchone()
            if existing:
                internal_id, target_cid = existing[0], existing[1]
                print(f"  ✅ 기존 회사 (CID: {target_cid})")
            else:
                target_cid = company['cid']
                cur.execute("""
                    INSERT INTO companies (cid, companies_name, address, size, homepage_url, logo, busi_cont, tot_psncnt)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id;
                """, (target_cid, truncate(c_name, 255), truncate(company.get('address'), 500), 
                      truncate(company.get('size'), 100), truncate(company.get('homepageUrl'), 500), 
                      truncate(company.get('logo'), 500), truncate(company.get('busiCont'), 5000), 
                      truncate(company.get('totPsncnt'), 50)))
                internal_id = cur.fetchone()[0]
                print(f"  🆕 신규 회사 (CID: {target_cid})")

            company_id_map[c_name] = target_cid # 매핑 저장
            conn.commit() 

            # 분석 및 임베딩 처리
            if check_company_project_exists(cur, c_name):
                print(f"  📊 프로젝트 분석: 이미 존재 (Skip)")
                analysis_stats["exists"] += 1
            else:
                analysis_stats["requested"] += 1
                if request_company_analysis(cur, c_name): 
                    analysis_stats["success"] += 1
                else:
                    analysis_stats["failed"] += 1
            conn.commit()

        print("\n" + "=" * 60 + "\n📝 채용 공고 적재\n" + "=" * 60)
        for job in data.get('jobPostings', []):
            job_stats["total"] += 1
            target_cid = company_id_map.get(job['company']['companiesName'])
            
            cur.execute("SELECT id FROM job_postings WHERE title = %s AND cid = %s;", (job['title'], target_cid))
            if cur.fetchone():
                job_stats["skipped"] += 1
                continue

            kst_now = datetime.now(timezone(timedelta(hours=9)))
            cur.execute("""
                INSERT INTO job_postings (title, active, start_date, end_date, vcnt, cid, detail, job_type)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id;
            """, (job['title'], job['active'], kst_now.strftime('%Y-%m-%d'), job['endDate'], 0, target_cid, job['detail'], 1))
            
            new_job_id = cur.fetchone()[0]
            for stack in job.get('skillTags', []):
                cur.execute("INSERT INTO posting_stacks (job_posting_id, stack_id) VALUES (%s, %s) ON CONFLICT DO NOTHING;", 
                            (new_job_id, stack['id']))
            job_stats["inserted"] += 1
        
        conn.commit()
        print(f"\n✅ 완료! 분석성공: {analysis_stats['success']}, 공고추가: {job_stats['inserted']}")

    except Exception as e:
        conn.rollback()
        print(f"\n❌ DB 적재 실패: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    insert_to_db()