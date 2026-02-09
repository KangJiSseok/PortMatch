import json
import psycopg2
import glob
import os
from dotenv import load_dotenv

# .env.prod 환경변수 로드
load_dotenv('.env.prod')

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        database=os.getenv('POSTGRES_DB', 'portmatch'),
        user=os.getenv('POSTGRES_USER', 'port'),
        password=os.getenv('POSTGRES_PASSWORD', 'match'),
        port=os.getenv('DB_PORT', '5432')
    )

def load_tech_stacks():
    # 1. 가장 최근의 tech_stacks JSON 파일 찾기
    files = glob.glob('db_tech_stacks_*.json')
    if not files:
        print("❌ 적재할 TechStack JSON 파일이 없습니다.")
        return
    
    latest_file = sorted(files)[-1]
    print(f"📂 파일 로드: {latest_file}")

    with open(latest_file, 'r', encoding='utf-8') as f:
        tech_data = json.load(f)

    conn = get_db_connection()
    cur = conn.cursor()

    print(f"🚀 총 {len(tech_data)}개의 기술 스택 적재 시작...")

    success_count = 0
    skip_count = 0

    for item in tech_data:
        stack_id = item['id']
        stack_name = item['stackName']

        try:
            # ⭐ 이름 체크 생략! 그냥 ID로 박아버리기. 
            # 만약 ID가 겹치면(CONFLICT) 아무것도 하지 마(DO NOTHING).
            cur.execute("""
                INSERT INTO tech_stacks (id, stack_name) 
                VALUES (%s, %s)
                ON CONFLICT (id) DO NOTHING;
            """, (stack_id, stack_name))
            
            # INSERT가 실제로 성공했는지 확인해서 카운트
            if cur.rowcount > 0:
                success_count += 1
            else:
                skip_count += 1

        except Exception as e:
            print(f"⚠️ 에러 발생: {e}")
            conn.rollback()
        else:
            conn.commit()

    cur.close()
    conn.close()
    print(f"\n✅ 적재 완료! (신규: {success_count}, 건너뜀: {skip_count})")

if __name__ == "__main__":
    load_tech_stacks()