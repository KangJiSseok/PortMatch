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

        # 2. ⭐ 핵심 로직: 이름(stackName)으로 중복 체크
        # 이름이 같으면 놔두고, 없을 때만 원티드 ID와 함께 인서트!
        cur.execute("SELECT id FROM tech_stacks WHERE stack_name = %s", (stack_name,))
        if cur.fetchone():
            skip_count += 1
            continue

        try:
            cur.execute(
                "INSERT INTO tech_stacks (id, stack_name) VALUES (%s, %s)",
                (stack_id, stack_name)
            )
            success_count += 1
        except Exception as e:
            print(f"⚠️ 저장 실패 [{stack_name}]: {e}")
            conn.rollback()
        else:
            conn.commit()

    cur.close()
    conn.close()
    print(f"\n✅ 적재 완료! (신규: {success_count}, 건너뜀: {skip_count})")

if __name__ == "__main__":
    load_tech_stacks()