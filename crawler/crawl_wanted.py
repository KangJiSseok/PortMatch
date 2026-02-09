#!/usr/bin/env python3
"""
원티드 채용공고 크롤러 (JSON 파일 저장 전용)
DB 연결 없이 JSON 파일로만 저장
"""

import os
import requests
import time
import json
from datetime import datetime

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json, text/plain, */*",
    "Referer": "https://www.wanted.co.kr/"
}

# 크롤링 개수 제한
CRAWL_LIMIT = int(os.getenv('CRAWL_LIMIT', '10'))

# 회사 ID 매핑 저장 (원본 ID → 새 ID)
company_id_map = {}


def load_existing_id_mapping():
    """기존 ID 매핑 파일 로드 (있으면)"""
    mapping_file = os.getenv('ID_MAPPING_FILE', 'company_id_mapping.json')
    
    if os.path.exists(mapping_file):
        try:
            with open(mapping_file, 'r', encoding='utf-8') as f:
                loaded_map = json.load(f)
                company_id_map.update(loaded_map)
                print(f"✅ 기존 ID 매핑 로드: {len(loaded_map)}개")
                return len(loaded_map)
        except Exception as e:
            print(f"⚠️  ID 매핑 로드 실패: {e}")
    
    return 0


def generate_company_id(original_id, company_name=None):
    """
    회사 ID 생성 (랜덤 대문자 10자)
    
    Args:
        original_id: 원티드 원본 회사 ID
        company_name: 회사명 (사용 안 함)
    
    Returns:
        str: 생성된 회사 ID (예: "ABCDEFGHIJ")
    """
    import random
    import string
    
    # 이미 생성된 ID가 있으면 재사용
    if original_id in company_id_map:
        return company_id_map[original_id]
    
    # 랜덤 대문자 10자 생성
    new_id = ''.join(random.choices(string.ascii_uppercase, k=10))
    
    # 매핑 저장
    company_id_map[original_id] = new_id
    return new_id


def format_detail_as_string(detail_obj):
    """detail 객체를 문자열로 변환"""
    if not detail_obj or not isinstance(detail_obj, dict):
        return None
    
    sections = []
    if detail_obj.get('intro'):
        sections.append(f"[회사 소개]\n{detail_obj['intro']}")
    if detail_obj.get('main_tasks'):
        sections.append(f"[주요 업무]\n{detail_obj['main_tasks']}")
    if detail_obj.get('requirements'):
        sections.append(f"[자격 요건]\n{detail_obj['requirements']}")
    if detail_obj.get('preferred_points'):
        sections.append(f"[우대 사항]\n{detail_obj['preferred_points']}")
    if detail_obj.get('benefits'):
        sections.append(f"[혜택 및 복지]\n{detail_obj['benefits']}")
    
    return "\n\n".join(sections) if sections else None


def get_all_tech_stacks():
    """원티드 전체 기술 스택 목록 가져오기"""
    print("\n" + "="*60)
    print("📚 기술 스택 데이터 크롤링")
    print("="*60)
    
    url = "https://www.wanted.co.kr/api/v4/tags"
    params = {"tag_type_id": 518}
    
    try:
        res = requests.get(url, headers=HEADERS, params=params, timeout=60)
        if res.status_code == 200:
            data = res.json()
            
            # API 응답 구조 확인
            if data.get('data') and len(data['data']) > 0:
                sub_tags = data['data'][0].get('sub_tags', [])
                tech_stacks = []
                
                for tag in sub_tags:
                    tech_stacks.append({
                        "id": tag.get('id'),
                        "stackName": tag.get('title')
                    })
                
                print(f"✅ {len(tech_stacks)}개 기술 스택 발견\n")
                return tech_stacks
            
            # 혹시 tags 키가 있다면 (예전 버전)
            tags = data.get('tags', [])
            if tags:
                tech_stacks = []
                for tag in tags:
                    tech_stacks.append({
                        "id": tag.get('id'),
                        "stackName": tag.get('title')
                    })
                print(f"✅ {len(tech_stacks)}개 기술 스택 발견\n")
                return tech_stacks
                
    except Exception as e:
        print(f"❌ TechStack API 에러: {e}\n")
    
    # 실제 공고에서 추출 시도
    print("⚠️  기본 API 실패, 공고에서 기술 스택 추출 시도...\n")
    return get_tech_stacks_from_jobs()


def get_tech_stacks_from_jobs():
    """실제 공고에서 기술 스택 추출"""
    url = "https://www.wanted.co.kr/api/v4/jobs"
    stacks_dict = {}
    
    for offset in range(0, 300, 100):
        params = {
            "tag_type_ids": 518,
            "country": "kr",
            "limit": 100,
            "offset": offset
        }
        
        try:
            print(f"  📊 {offset}~{offset+100} 공고 조회...", end=" ")
            res = requests.get(url, headers=HEADERS, params=params, timeout=60)
            
            if res.status_code == 200:
                jobs = res.json().get('data', [])
                
                if not jobs:
                    print("(더 이상 없음)")
                    break
                
                print(f"✅ {len(jobs)}개")
                
                for job in jobs:
                    for tag in job.get('skill_tags', []):
                        tag_id = tag.get('id')
                        tag_title = tag.get('title')
                        if tag_id and tag_title:
                            stacks_dict[tag_id] = tag_title
                
                time.sleep(0.5)
            else:
                print(f"❌ HTTP {res.status_code}")
                break
                
        except Exception as e:
            print(f"❌ 에러: {e}")
            break
    
    stacks = [{"id": sid, "stackName": sname} for sid, sname in stacks_dict.items()]
    stacks.sort(key=lambda x: x['id'])
    
    print(f"✅ 총 {len(stacks)}개 고유 기술 스택 추출 완료\n")
    return stacks


def get_company_detail(company_id):
    """회사 상세 정보 가져오기"""
    url = f"https://www.wanted.co.kr/api/v4/companies/{company_id}"
    try:
        res = requests.get(url, headers=HEADERS, timeout=60)
        if res.status_code == 200:
            company = res.json().get('company', {})
            
            address = company.get('company_address', {}).get('full_location')
            homepage = company.get('detail', {}).get('link')
            
            employee_count = None
            for tag in company.get('company_tags', []):
                if '명' in tag.get('title', ''):
                    employee_count = tag.get('title')
                    break
            
            original_id = str(company.get('id'))
            company_name = company.get('name')
            
            # ⭐ 새 ID 생성
            new_cid = generate_company_id(original_id, company_name)
            
            return {
                "cid": new_cid,
                "companiesName": company_name,
                "address": address,
                "size": company.get('industry_name'),
                "homepageUrl": homepage,
                "totPsncnt": employee_count,
                "yrSalesAmt": None,
                "busiCont": company.get('description'),
                "logo": company.get('logo_img', {}).get('origin')
            }
    except Exception as e:
        print(f"  ⚠️  Company API 실패 [{company_id}]: {e}")
    return None


def get_job_detail(job_id):
    """공고 상세 정보 가져오기"""
    url = f"https://www.wanted.co.kr/api/v4/jobs/{job_id}"
    try:
        res = requests.get(url, headers=HEADERS, timeout=60)
        if res.status_code == 200:
            job = res.json().get('job', {})
            company_data = job.get('company', {})
            detail_string = format_detail_as_string(job.get('detail', {}))
            
            original_company_id = str(company_data.get('id'))
            company_name = company_data.get('name')
            
            # ⭐ 새 ID 생성
            new_cid = generate_company_id(original_company_id, company_name)
            
            basic_company_info = {
                "cid": new_cid,
                "companiesName": company_name,
                "address": None,
                "size": None,
                "homepageUrl": None,
                "totPsncnt": None,
                "yrSalesAmt": None,
                "busiCont": None,
                "logo": company_data.get('logo_thumb_img', {}).get('origin') if company_data.get('logo_thumb_img') else None
            }
            
            # 기술 스택
            skill_tags = [
                {
                    "id": tag.get('id'),
                    "title": tag.get('title')
                }
                for tag in job.get('skill_tags', [])
            ]
            
            return {
                "id": job.get('id'),
                "title": job.get('position'),
                "active": 1 if job.get('status') == 'active' else 0,
                "startDate": job.get('is_confirm_time'),
                "endDate": job.get('due_time'),
                "vcnt": 0,
                "cid": new_cid,
                "detail": detail_string,
                "jobType": 1,
                "company": basic_company_info,
                "skillTags": skill_tags,
                "_originalCompanyId": original_company_id  # API 호출용 (내부)
            }
    except Exception as e:
        print(f"  ❌ Job API Error [{job_id}]: {e}")
    return None


def save_json_file(data, filename):
    """JSON 파일 저장"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"💾 {filename} 저장 완료!")


def main():
    """메인 크롤링 함수"""
    
    print("=" * 60)
    print("🚀 원티드 채용공고 크롤링 시작 (JSON 전용)")
    print("=" * 60)
    print(f"📊 크롤링 개수: {CRAWL_LIMIT}개")
    print(f"🏢 회사 ID: 랜덤 대문자 10자 생성")
    print("=" * 60)
    
    # ⭐ 기존 ID 매핑 로드 (있으면)
    load_existing_id_mapping()
    
    # 결과 저장용
    result = {
        "crawledAt": datetime.now().isoformat(),
        "totalCount": 0,
        "successCount": 0,
        "failCount": 0,
        "techStacks": [],
        "jobPostings": []
    }
    
    try:
        # 1단계: 기술 스택 크롤링
        tech_stacks = get_all_tech_stacks()
        result["techStacks"] = tech_stacks
        
        # 2단계: 채용공고 크롤링
        print("=" * 60)
        print("📊 채용공고 크롤링 시작")
        print("=" * 60)
        
        list_url = f"https://www.wanted.co.kr/api/v4/jobs?tag_type_ids=518&country=kr&limit={CRAWL_LIMIT}&job_sort=job.latest_order"
        response = requests.get(list_url, headers=HEADERS, timeout=60)
        job_list_data = response.json().get('data', [])
        
        result["totalCount"] = len(job_list_data)
        print(f"📊 총 {len(job_list_data)}개 공고 발견\n")
        
        for idx, item in enumerate(job_list_data, 1):
            job_id = item.get('id')
            print(f"\n[{idx}/{len(job_list_data)}] 🔍 공고 ID: {job_id}")
            
            try:
                # 공고 정보
                job_data = get_job_detail(job_id)
                if not job_data:
                    result["failCount"] += 1
                    continue
                
                # 회사 상세 정보 (⭐ 원본 ID 사용)
                original_company_id = job_data.get('_originalCompanyId')
                if original_company_id:
                    company_detail = get_company_detail(original_company_id)
                    if company_detail:
                        job_data['company'] = company_detail
                    else:
                        # API 실패 시 기본 정보 유지
                        print(f"  ⚠️  회사 상세 정보 없음 (기본 정보 사용)")
                
                # 내부 필드 제거
                job_data.pop('_originalCompanyId', None)
                
                result["jobPostings"].append(job_data)
                result["successCount"] += 1
                
                print(f"  ✅ {job_data['title']}")
                print(f"  🏢 {job_data['company']['companiesName']}")
                print(f"  🔧 기술 스택: {len(job_data['skillTags'])}개")
                
            except Exception as e:
                print(f"  ❌ 처리 실패: {e}")
                result["failCount"] += 1
            
            time.sleep(0.5)
        
        # 3단계: JSON 파일 저장
        print("\n" + "=" * 60)
        print("💾 JSON 파일 저장 중...")
        print("=" * 60)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # 전체 데이터
        save_json_file(result, f"wanted_crawl_full_{timestamp}.json")
        
        # 공고만 따로
        save_json_file(result["jobPostings"], f"wanted_jobs_{timestamp}.json")
        
        # 기술 스택만 따로
        save_json_file(result["techStacks"], f"wanted_tech_stacks_{timestamp}.json")
        
        # ⭐ 회사 ID 매핑 저장
        if company_id_map:
            # 타임스탬프 버전 (백업용)
            save_json_file(company_id_map, f"wanted_company_id_mapping_{timestamp}.json")
            # 고정 이름 버전 (다음 크롤링에서 재사용)
            save_json_file(company_id_map, "company_id_mapping.json")
        
        # 요약 정보
        summary = {
            "crawledAt": result["crawledAt"],
            "totalCount": result["totalCount"],
            "successCount": result["successCount"],
            "failCount": result["failCount"],
            "techStackCount": len(result["techStacks"]),
            "companyIdMappingCount": len(company_id_map),
            "files": [
                f"wanted_crawl_full_{timestamp}.json",
                f"wanted_jobs_{timestamp}.json",
                f"wanted_tech_stacks_{timestamp}.json"
            ]
        }
        
        if company_id_map:
            summary["files"].append(f"wanted_company_id_mapping_{timestamp}.json")
        save_json_file(summary, f"wanted_summary_{timestamp}.json")
        
        # 최종 출력
        print("\n" + "=" * 60)
        print("✅ 크롤링 완료!")
        print("=" * 60)
        print(f"📊 전체: {result['totalCount']}개")
        print(f"✅ 성공: {result['successCount']}개")
        print(f"❌ 실패: {result['failCount']}개")
        print(f"🔧 기술 스택: {len(result['techStacks'])}개")
        if company_id_map:
            print(f"🔗 회사 ID 매핑: {len(company_id_map)}개")
        print("\n📁 생성된 파일:")
        for file in summary["files"]:
            print(f"   - {file}")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ 크롤링 실패: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
