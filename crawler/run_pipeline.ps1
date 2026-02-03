# 채용공고 크롤링 및 임베딩 파이프라인 (PowerShell 버전)
# 사용법: .\run_pipeline.ps1

$ErrorActionPreference = "Stop"

Write-Host "=================================================="
Write-Host "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') pipeline start"
Write-Host "=================================================="

Write-Host ""
Write-Host "--------------------------------------------------"
Write-Host "1) Wanted crawling"
Write-Host "--------------------------------------------------"
python crawl_wanted.py

Write-Host ""
Write-Host "--------------------------------------------------"
Write-Host "2) Preprocess data"
Write-Host "--------------------------------------------------"
python preprocessor.py

Write-Host ""
Write-Host "--------------------------------------------------"
Write-Host "3) Save tech stacks to DB"
Write-Host "--------------------------------------------------"
python load_tech_stacks.py

Write-Host ""
Write-Host "--------------------------------------------------"
Write-Host "4) Save jobs/companies to DB"
Write-Host "--------------------------------------------------"
python json_to_db.py

Write-Host ""
Write-Host "--------------------------------------------------"
Write-Host "5) LLM parsing"
Write-Host "--------------------------------------------------"
python job_posting_parser.py

Write-Host ""
Write-Host "--------------------------------------------------"
Write-Host "6) Save parsed results to DB"
Write-Host "--------------------------------------------------"
python save_parsed_to_db.py

Write-Host ""
Write-Host "--------------------------------------------------"
Write-Host "7) Generate embeddings"
Write-Host "--------------------------------------------------"
python generate_job_posting_embeddings.py

Write-Host ""
Write-Host "--------------------------------------------------"
Write-Host "8) Cleanup temp files"
Write-Host "--------------------------------------------------"
Remove-Item -Force -ErrorAction SilentlyContinue wanted_crawl_full_*.json
Remove-Item -Force -ErrorAction SilentlyContinue wanted_jobs_*.json
Remove-Item -Force -ErrorAction SilentlyContinue wanted_summary_*.json
Remove-Item -Force -ErrorAction SilentlyContinue wanted_tech_stacks_*.json
Remove-Item -Force -ErrorAction SilentlyContinue wanted_company_id_mapping_*.json
Remove-Item -Force -ErrorAction SilentlyContinue db_tech_stacks_*.json
Remove-Item -Force -ErrorAction SilentlyContinue db_companies_*.json
Remove-Item -Force -ErrorAction SilentlyContinue db_job_postings_*.json
Remove-Item -Force -ErrorAction SilentlyContinue db_ready_data_*.json
Remove-Item -Force -ErrorAction SilentlyContinue job_posting_embeddings_*.json
# company_id_mapping.json은 유지!

Write-Host ""
Write-Host "=================================================="
Write-Host "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') all done"
Write-Host "=================================================="

