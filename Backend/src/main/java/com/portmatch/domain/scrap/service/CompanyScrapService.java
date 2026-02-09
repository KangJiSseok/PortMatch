package com.portmatch.domain.scrap.service;

import com.portmatch.domain.scrap.dto.CompanyScrapDto;
import java.util.List;

public interface CompanyScrapService {
    // 내가 스크랩한 기업 목록 조회
    List<CompanyScrapDto> getMyCompanyScraps(Long uid);

    // 기업 스크랩 토글 (있으면 삭제, 없으면 저장)
    boolean toggleCompanyScrap(Long uid, String cid);

    // 스크랩 여부 확인
    boolean isCompanyScraped(Long uid, String cid);
}