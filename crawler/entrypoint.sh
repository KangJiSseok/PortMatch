#!/bin/bash

# 1. 에러 발생 시 즉시 중단
set -e

echo "--------------------------------------------------"
echo "🚀 [$(date)] 1단계: 원티드 크롤링 시작"
echo "--------------------------------------------------"
python crawl_wanted.py

echo "--------------------------------------------------"
echo "📊 [$(date)] 2단계: 데이터 전처리(ID 랜덤화 등) 시작"
echo "--------------------------------------------------"
# ⭐ 이 단계를 꼭 거쳐야 db_ready_data_*.json 파일이 생겨!
python preprocessor.py 

python3 load_tech_stacks.py

echo "--------------------------------------------------"
echo "💾 [$(date)] 3단계: DB 적재 프로세스 시작"
echo "--------------------------------------------------"
python json_to_db.py

echo "--------------------------------------------------"
echo "🤖 [$(date)] 4단계: LLM 파싱 시작"
echo "--------------------------------------------------"
python job_posting_parser.py

echo "--------------------------------------------------"
echo "💾 [$(date)] 5단계: 파싱 결과 DB 저장"
echo "--------------------------------------------------"
python save_parsed_to_db.py

echo "--------------------------------------------------"
echo "🧹 [$(date)] 6단계: 임시 JSON 파일 정리"
echo "--------------------------------------------------"
# 작업이 끝났으니 용량 차이 안 나게 싹 지워버리자
rm -f wanted_crawl_full_*.json
rm -f wanted_jobs_*.json
rm -f wanted_summary_*.json
rm -f wanted_tech_stacks_*.json
rm -f wanted_company_id_mapping_*.json
rm -f db_tech_stacks_*.json
rm -f db_companies_*.json
rm -f db_job_postings_*.json
rm -f db_ready_data_*.json
rm -f job_posting_embeddings_*.json
# company_id_mapping.json은 다음 크롤링에서 재사용하므로 유지!


echo "--------------------------------------------------"
echo "✅ [$(date)] 모든 작업이 성공적으로 완료되었습니다!"
echo "--------------------------------------------------"
