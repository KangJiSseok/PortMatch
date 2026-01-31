#!/usr/bin/env python3
"""
JSON 데이터 변환 및 저장 (DB 없이 JSON 파일로만)
- skillTags에서 TechStack 추출
- 회사 ID를 랜덤 대문자 10자로 변환
- 최종 저장용 JSON 생성
"""

import json
import random
import string
from datetime import datetime

# 회사 ID 매핑 (원본 ID → 랜덤 ID)
company_id_map = {}


def generate_company_id(original_id):
    """랜덤 대문자 10자 생성"""
    if original_id in company_id_map:
        return company_id_map[original_id]
    
    new_id = ''.join(random.choices(string.ascii_uppercase, k=10))
    company_id_map[original_id] = new_id
    return new_id


def load_json_file(filename):
    """JSON 파일 로드"""
    print(f"📄 {filename} 로드 중...")
    with open(filename, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # jobPostings 추출
    if isinstance(data, dict):
        job_postings = data.get('jobPostings', [])
    else:
        job_postings = data
    
    print(f"✅ {len(job_postings)}개 공고 로드 완료\n")
    return job_postings


def extract_tech_stacks(job_postings):
    """
    모든 공고의 skillTags에서 TechStack 추출
    """
    print("=" * 60)
    print("📚 TechStack 추출 중...")
    print("=" * 60)
    
    all_stacks = {}  # {id: title}
    
    for job in job_postings:
        skill_tags = job.get('skillTags', [])
        for tag in skill_tags:
            tag_id = tag.get('id')
            tag_title = tag.get('title')
            if tag_id and tag_title:
                all_stacks[tag_id] = tag_title
    
    # 리스트로 변환 (정렬)
    tech_stacks = [
        {"id": stack_id, "stackName": stack_name}
        for stack_id, stack_name in sorted(all_stacks.items())
    ]
    
    print(f"✅ 총 {len(tech_stacks)}개 고유 기술 스택 추출")
    print(f"\n📌 샘플 (처음 10개):")
    for i, stack in enumerate(tech_stacks[:10], 1):
        print(f"   {i}. [{stack['id']}] {stack['stackName']}")
    
    if len(tech_stacks) > 10:
        print(f"   ... 외 {len(tech_stacks) - 10}개")
    
    print()
    return tech_stacks


def transform_job_postings(job_postings):
    """
    공고 데이터 변환 (CID를 랜덤 문자열로)
    """
    print("=" * 60)
    print("📊 JobPosting 변환 중...")
    print("=" * 60)
    
    transformed_jobs = []
    
    for idx, job in enumerate(job_postings, 1):
        # 원본 CID
        original_cid = job.get('cid')
        
        if not original_cid:
            print(f"[{idx}] ⚠️  CID 없음, 스킵")
            continue
        
        # 랜덤 CID 생성
        new_cid = generate_company_id(original_cid)
        
        # 공고 데이터 복사 및 변환
        transformed_job = job.copy()
        transformed_job['cid'] = new_cid
        
        # Company 데이터도 변환
        if 'company' in transformed_job:
            company = transformed_job['company'].copy()
            company['cid'] = new_cid
            transformed_job['company'] = company
        
        transformed_jobs.append(transformed_job)
        
        if idx % 10 == 0:
            print(f"  진행: {idx}/{len(job_postings)}...")
    
    print(f"✅ {len(transformed_jobs)}개 공고 변환 완료\n")
    return transformed_jobs


def extract_companies(job_postings):
    """
    공고에서 회사 정보 추출 (중복 제거)
    """
    print("=" * 60)
    print("🏢 Company 추출 중...")
    print("=" * 60)
    
    companies_dict = {}
    
    for job in job_postings:
        company = job.get('company', {})
        cid = company.get('cid')
        
        if cid and cid not in companies_dict:
            companies_dict[cid] = company
    
    companies = list(companies_dict.values())
    
    print(f"✅ {len(companies)}개 고유 회사 추출")
    print(f"\n📌 샘플 (처음 5개):")
    for i, company in enumerate(companies[:5], 1):
        print(f"   {i}. [{company.get('cid')}] {company.get('companiesName')}")
    
    if len(companies) > 5:
        print(f"   ... 외 {len(companies) - 5}개")
    
    print()
    return companies


def save_json(data, filename):
    """JSON 파일 저장"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"💾 {filename} 저장 완료!")


def main():
    """메인 함수"""
    print("=" * 60)
    print("🚀 JSON 데이터 변환 및 저장")
    print("=" * 60)
    print()
    
    # 입력 파일
    import glob
    files = glob.glob('wanted_crawl_full_*.json')
    
    if not files:
        print("❌ wanted_crawl_full_*.json 파일을 찾을 수 없습니다.")
        print("   crawl_wanted_json_only_final.py를 먼저 실행하세요.")
        return
    
    # 가장 최근 파일 사용
    input_file = sorted(files)[-1]
    print(f"📂 입력 파일: {input_file}\n")
    
    # JSON 로드
    job_postings = load_json_file(input_file)
    
    if not job_postings:
        print("❌ 공고 데이터가 없습니다.")
        return
    
    # 1. TechStack 추출
    tech_stacks = extract_tech_stacks(job_postings)
    
    # 2. JobPosting 변환 (CID 변경)
    transformed_jobs = transform_job_postings(job_postings)
    
    # 3. Company 추출
    companies = extract_companies(transformed_jobs)
    
    # 4. 결과 저장
    print("=" * 60)
    print("💾 결과 저장 중...")
    print("=" * 60)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # 개별 파일 저장
    save_json(tech_stacks, f'db_tech_stacks_{timestamp}.json')
    save_json(companies, f'db_companies_{timestamp}.json')
    save_json(transformed_jobs, f'db_job_postings_{timestamp}.json')
    
    # 통합 파일 저장
    final_data = {
        "metadata": {
            "transformedAt": datetime.now().isoformat(),
            "totalTechStacks": len(tech_stacks),
            "totalCompanies": len(companies),
            "totalJobPostings": len(transformed_jobs),
            "companyIdMappingCount": len(company_id_map)
        },
        "techStacks": tech_stacks,
        "companies": companies,
        "jobPostings": transformed_jobs,
        "companyIdMapping": company_id_map
    }
    
    save_json(final_data, f'db_ready_data_{timestamp}.json')
    
    # 요약 출력
    print("\n" + "=" * 60)
    print("✅ 작업 완료!")
    print("=" * 60)
    print(f"📚 TechStack: {len(tech_stacks)}개")
    print(f"🏢 Company: {len(companies)}개")
    print(f"📊 JobPosting: {len(transformed_jobs)}개")
    print(f"🔗 CID 매핑: {len(company_id_map)}개")
    print()
    print("📁 생성된 파일:")
    print(f"   - db_tech_stacks_{timestamp}.json")
    print(f"   - db_companies_{timestamp}.json")
    print(f"   - db_job_postings_{timestamp}.json")
    print(f"   - db_ready_data_{timestamp}.json (통합)")
    print("=" * 60)
    
    # 데이터 미리보기
    print("\n" + "=" * 60)
    print("📋 데이터 미리보기")
    print("=" * 60)
    
    print("\n[TechStack 샘플]")
    print(json.dumps(tech_stacks[0], indent=2, ensure_ascii=False))
    
    print("\n[Company 샘플]")
    print(json.dumps(companies[0], indent=2, ensure_ascii=False))
    
    print("\n[JobPosting 샘플 - 일부만]")
    sample_job = {
        "id": transformed_jobs[0].get('id'),
        "title": transformed_jobs[0].get('title'),
        "cid": transformed_jobs[0].get('cid'),
        "company": {
            "cid": transformed_jobs[0].get('company', {}).get('cid'),
            "companiesName": transformed_jobs[0].get('company', {}).get('companiesName')
        },
        "skillTags": transformed_jobs[0].get('skillTags', [])[:3]
    }
    print(json.dumps(sample_job, indent=2, ensure_ascii=False))
    
    print("\n" + "=" * 60)


if __name__ == "__main__":
    main()
