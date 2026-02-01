package com.portmatch.domain.scrap.service;

import com.portmatch.domain.scrap.dto.CompanyScrapDto;
import com.portmatch.domain.scrap.entity.CompanyScrapEntity;
import com.portmatch.domain.scrap.repository.CompanyScrapRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CompanyScrapServiceImpl implements CompanyScrapService {

    private final CompanyScrapRepository companyScrapRepository;

    /**
     * 기업 스크랩 토글 로직
     * @return true면 스크랩 등록, false면 스크랩 해제
     */
    @Transactional
    @Override
    public boolean toggleCompanyScrap(Long uid, String cid) {
        // 1. 이미 스크랩 했는지 확인 (Optional 활용)
        return companyScrapRepository.findByUidAndCid(uid, cid)
                .map(scrap -> {
                    // 2. 존재하면 삭제 (스크랩 취소)
                    companyScrapRepository.delete(scrap);
                    return false;
                })
                .orElseGet(() -> {
                    // 3. 존재하지 않으면 등록 (스크랩 추가)
                    CompanyScrapEntity newScrap = CompanyScrapEntity.builder()
                            .uid(uid)
                            .cid(cid)
                            .build();
                    companyScrapRepository.save(newScrap);
                    return true;
                });
    }

    @Override
    public boolean isCompanyScraped(Long uid, String cid) {
        return companyScrapRepository.existsByUidAndCid(uid, cid);
    }

    /**
     * 특정 유저의 기업 스크랩 목록 조회
     * 도메인 분석 가중치 계산 시 이 목록을 불러와서 처리하면 돼!
     */
    @Transactional(readOnly = true)
    @Override
    public List<CompanyScrapDto> getMyCompanyScraps(Long uid) {
        return companyScrapRepository.findAllByUidOrderByCreatedAtDesc(uid).stream()
                .map(CompanyScrapDto::fromEntity)
                .collect(Collectors.toList());
    }
}