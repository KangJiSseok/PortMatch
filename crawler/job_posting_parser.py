#!/usr/bin/env python3
"""
채용공고 LLM 파싱 모듈
- LangChain을 사용하여 채용공고 상세 정보를 구조화된 JSON으로 변환
- 포트폴리오 프로젝트와의 시맨틱 매칭을 위한 전처리
"""

import os
import json
import glob
from datetime import datetime
from dotenv import load_dotenv
import psycopg2

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

# 환경변수 로드
load_dotenv(".env.prod")


def get_db_connection():
    """PostgreSQL DB 연결"""
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        database=os.getenv('POSTGRES_DB', 'portmatch'),
        user=os.getenv('POSTGRES_USER', 'port'),
        password=os.getenv('POSTGRES_PASSWORD', 'match'),
        port=os.getenv('DB_PORT', '5432')
    )


def get_existing_job_postings():
    """DB에서 기존 (title, cid) 조합 조회"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT title, cid FROM job_postings")
        existing = set((row[0], row[1]) for row in cur.fetchall())
        cur.close()
        conn.close()
        print(f"📊 DB에서 기존 채용공고 {len(existing)}개 조회됨\n")
        return existing
    except Exception as e:
        print(f"⚠️ DB 연결 실패, 중복 체크 없이 진행: {e}\n")
        return set()

# LLM 설정
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_TEMPERATURE = float(os.getenv("OPENAI_TEMPERATURE", "0.2"))


# 채용공고 파싱용 프롬프트
PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are an expert at analyzing Korean job postings. "
            "Extract structured information from job posting details. "
            "Focus on what the company does and what skills/experience they need. "
            "Return JSON only. No Markdown, no extra text."
        ),
        (
            "human",
            "다음은 채용공고의 상세 정보입니다.\n"
            "이 공고에서 name, domain, problem, solution, tech, architecture_experience, keywords를 추출하세요.\n\n"
            
            "name은 이 포지션에서 개발/담당하게 될 서비스나 시스템을 한 줄로 설명하세요.\n"
            "예: \"AI 기반 통합 모니터링 플랫폼\", \"B2B SaaS 인력관리 솔루션\"\n\n"
            
            "domain은 회사/서비스의 도메인을 짧은 라벨로 작성하세요.\n"
            "예: IT 인프라, HR, 핀테크, 헬스케어, 이커머스, 교육 등\n\n"
            
            "problem은 이 회사/서비스가 해결하려는 문제를 한 문장으로 요약하세요.\n"
            "주요업무나 회사 소개에서 힌트를 얻으세요.\n\n"
            
            "solution은 그 문제를 어떻게 해결하는지 한 문장으로 요약하세요.\n"
            "가능하면 핵심 기술이나 접근 방식을 포함하세요.\n\n"
            
            "tech는 자격요건/우대사항에서 언급된 기술 스택을 문자열 배열로 반환하세요.\n"
            "프레임워크, 라이브러리, 플랫폼, 도구 위주로 영어 표기 통일.\n"
            "예: [\"Spring Boot\", \"JPA\", \"Kubernetes\", \"PostgreSQL\"]\n\n"
            
            "architecture_experience는 자격요건에서 요구하는 아키텍처/시스템 설계 경험을 배열로 반환하세요.\n"
            "각 항목은 한 문장으로 작성하세요.\n"
            "예: [\"MSA 설계 및 운영 경험\", \"대규모 트래픽 성능 최적화\", \"멀티클라우드 환경 구축\"]\n\n"
            
            "keywords는 위 항목에 포함되지 않은 핵심 역량/특징/주제 키워드를 배열로 반환하세요.\n"
            "예: [\"실시간 처리\", \"데이터 수집\", \"SaaS\", \"글로벌 확장\"]\n\n"
            
            "혜택 및 복지, 채용 전형 등 직무와 관련 없는 내용은 무시하세요.\n"
            "정보가 없는 필드는 빈 문자열 또는 빈 배열로 두세요.\n\n"
            
            "출력 형식은 반드시 JSON 객체입니다. 예:\n"
            '{{\"name\":\"\", \"domain\":\"\", \"problem\":\"\", \"solution\":\"\", \"tech\":[], \"architecture_experience\":[], \"keywords\":[]}}\n\n'
            
            "채용공고 상세:\n{content}\n"
        ),
    ]
)


def build_job_posting_parser_chain():
    """LangChain 체인 생성"""
    llm = ChatOpenAI(model=OPENAI_MODEL, temperature=OPENAI_TEMPERATURE)
    parser = JsonOutputParser()
    chain = PROMPT | llm | parser
    return chain


def load_job_postings(filename=None):
    """
    크롤링된 채용공고 JSON 파일 로드
    
    Args:
        filename: 특정 파일명 (없으면 최신 파일 자동 선택)
    
    Returns:
        list: 채용공고 리스트
    """
    if filename is None:
        # db_ready_data_*.json 또는 wanted_crawl_full_*.json 찾기
        files = glob.glob('db_ready_data_*.json') + glob.glob('wanted_crawl_full_*.json')
        if not files:
            print("❌ 크롤링된 JSON 파일이 없습니다.")
            return []
        filename = sorted(files)[-1]
    
    print(f"📂 파일 로드: {filename}")
    
    with open(filename, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # jobPostings 추출
    if isinstance(data, dict):
        job_postings = data.get('jobPostings', [])
    else:
        job_postings = data
    
    print(f"✅ {len(job_postings)}개 공고 로드 완료\n")
    return job_postings


def parse_job_posting(chain, job_posting):
    """
    단일 채용공고 파싱
    
    Args:
        chain: LangChain 체인
        job_posting: 채용공고 딕셔너리
    
    Returns:
        dict: 파싱 결과
    """
    detail = job_posting.get('detail', '')
    
    if not detail or len(detail.strip()) < 50:
        return None
    
    try:
        result = chain.invoke({"content": detail})
        return result
    except Exception as e:
        print(f"  ⚠️ 파싱 실패: {e}")
        return None


def main():
    """메인 함수"""
    print("=" * 60)
    print("🚀 채용공고 LLM 파싱 시작")
    print("=" * 60)
    print(f"📊 모델: {OPENAI_MODEL}")
    print(f"🌡️ Temperature: {OPENAI_TEMPERATURE}")
    print("=" * 60 + "\n")
    
    # 채용공고 로드
    job_postings = load_job_postings()
    
    if not job_postings:
        return
    
    # LangChain 체인 생성
    chain = build_job_posting_parser_chain()
    
    # DB에서 기존 채용공고 조회 (중복 스킵용)
    existing_jobs = get_existing_job_postings()
    
    # 결과 저장용
    results = []
    success_count = 0
    skip_count = 0
    fail_count = 0
    
    print("=" * 60)
    print("📝 채용공고 파싱 시작")
    print("=" * 60 + "\n")
    
    for idx, job in enumerate(job_postings, 1):
        job_id = job.get('id', idx)
        title = job.get('title', 'Unknown')
        cid = job.get('cid')
        company_name = job.get('company', {}).get('companiesName', 'Unknown')
        
        print(f"[{idx}/{len(job_postings)}] 🔍 {title}")
        print(f"  🏢 {company_name}")
        
        # DB에 이미 존재하는 (title, cid) 조합이면 스킵
        if (title, cid) in existing_jobs:
            print(f"  ⏭️ 스킵 (DB에 이미 존재)")
            skip_count += 1
            print()
            continue
        
        parsed = parse_job_posting(chain, job)
        
        if parsed:
            result = {
                "job_posting_id": job_id,
                "title": title,
                "company_name": company_name,
                "cid": job.get('cid'),
                "parsed": parsed
            }
            results.append(result)
            success_count += 1
            
            print(f"  ✅ 파싱 완료")
            print(f"     📌 Name: {parsed.get('name', '')[:50]}...")
            print(f"     🏷️ Domain: {parsed.get('domain', '')}")
            print(f"     🔧 Tech: {len(parsed.get('tech', []))}개")
        else:
            fail_count += 1
            print(f"  ❌ 파싱 실패 (detail 없음 또는 오류)")
        
        print()
    
    # 결과 저장
    print("=" * 60)
    print("💾 결과 저장 중...")
    print("=" * 60)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    output_file = f"job_posting_embeddings_{timestamp}.json"
    
    output_data = {
        "metadata": {
            "parsedAt": datetime.now().isoformat(),
            "model": OPENAI_MODEL,
            "temperature": OPENAI_TEMPERATURE,
            "totalCount": len(job_postings),
            "successCount": success_count,
            "skipCount": skip_count,
            "failCount": fail_count
        },
        "results": results
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    print(f"💾 {output_file} 저장 완료!\n")
    
    # 최종 출력
    print("=" * 60)
    print("✅ 파싱 완료!")
    print("=" * 60)
    print(f"📊 전체: {len(job_postings)}개")
    print(f"✅ 성공: {success_count}개")
    print(f"⏭️ 스킵: {skip_count}개 (DB에 이미 존재)")
    print(f"❌ 실패: {fail_count}개")
    print(f"\n📁 생성된 파일: {output_file}")
    print("=" * 60)
    
    # 샘플 출력
    if results:
        print("\n📋 샘플 결과 (첫 번째):")
        print(json.dumps(results[0], indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
