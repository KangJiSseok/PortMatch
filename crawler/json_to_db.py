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
    """
    회사 이름을 가지고 embeddings 테이블에 데이터가 있는지 확인 (JOIN 필요)
    """
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
    
    # ⭐ 수정: company_name (스네이크 케이스 + 리스트)
    payload = {
        "company_name": [company_name]  # companyNames ❌ → company_name ✅
    }
    
    try:
        print(f"    🔍 회사 프로젝트 분석 요청: {company_name}")
        
        response = requests.post(
            url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        if response.status_code == 200:
            print(f"    ✅ 분석 완료: {company_name}")
            print(f"DEBUG RESPONSE: {response.json()}")
            return True
        else:
            print(f"    ⚠️  분석 실패 [{response.status_code}]: {company_name}")
            return False
    except Exception as e:
        print(f"    ❌ API 요청 실패: {e}")
        return False


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

    # 통계
    analysis_stats = {
        "total": 0,
        "exists": 0,
        "requested": 0,
        "success": 0,
        "failed": 0
    }

    try:
        cur.execute("SELECT setval(pg_get_serial_sequence('job_postings', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM job_postings;")

        # 3. 회사 정보 적재 (엔티티 컬럼명 companies_name 등 반영)
        print("\n" + "=" * 60)
        print("🏢 회사 정보 체크 및 적재...")
        print("=" * 60)
        
        # 이름 매칭 로직으로 가입 기업의 cid를 보존함
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
            
            # ⭐ 회사 프로젝트 분석 체크 및 요청
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

        # 4. 채용 공고 적재 (제목+cid로 중복 체크하여 찜하기 보호)
        print("\n" + "=" * 60)
        print("📝 채용 공고 적재 시작...")
        print("=" * 60)
        
        job_stats = {"total": 0, "inserted": 0, "skipped": 0}
        
        for job in data.get('jobPostings', []):
            job_stats["total"] += 1
            target_cid = company_id_map.get(job['company']['companiesName'])

            cur.execute("""
                SELECT id FROM job_postings WHERE title = %s AND cid = %s;
            """, (job['title'], target_cid))

            if cur.fetchone():
                job_stats["skipped"] += 1
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
            job_stats["inserted"] += 1

            # 5. 공고-스택 연결 (중간 테이블)
            for stack in job.get('skillTags', []):
                cur.execute("""
                    INSERT INTO posting_stacks (job_posting_id, stack_id)
                    VALUES (%s, %s) ON CONFLICT DO NOTHING;
                """, (new_job_id, stack['id']))

        conn.commit()
        
        # 최종 통계
        print("\n" + "=" * 60)
        print("✅ 모든 데이터가 엔티티 구조에 맞춰 적재되었습니다!")
        print("=" * 60)
        
        print("\n📊 회사 프로젝트 분석 통계:")
        print(f"  - 전체 회사: {analysis_stats['total']}개")
        print(f"  - 이미 존재: {analysis_stats['exists']}개")
        print(f"  - API 요청: {analysis_stats['requested']}개")
        print(f"    ✅ 성공: {analysis_stats['success']}개")
        print(f"    ❌ 실패: {analysis_stats['failed']}개")
        
        print(f"\n📊 채용 공고 통계:")
        print(f"  - 전체: {job_stats['total']}개")
        print(f"  - 신규 추가: {job_stats['inserted']}개")
        print(f"  - 중복 스킵: {job_stats['skipped']}개")
        print("=" * 60)

    except Exception as e:
        conn.rollback()
        print(f"\n❌ DB 적재 실패: {e}")
        import traceback
        traceback.print_exc()
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    insert_to_db()