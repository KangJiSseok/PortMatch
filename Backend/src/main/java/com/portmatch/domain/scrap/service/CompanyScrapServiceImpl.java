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
    private final com.portmatch.domain.auth.repository.UserRepository userRepository; // 추가
    private final com.portmatch.domain.companies.repository.CompanyRepository companyRepository; // 추가

    @Transactional
    @Override
    public boolean toggleCompanyScrap(Long uid, String cid) {
        // Repository 메서드 이름도 아마 findByUser_IdAndCompany_Cid 등으로 바뀌어야 할 거야!
        return companyScrapRepository.findByUser_IdAndCompany_Cid(uid, cid)
                .map(scrap -> {
                    companyScrapRepository.delete(scrap);
                    return false;
                })
                .orElseGet(() -> {
                    // 1. 유저 객체 찾기
                    var user = userRepository.findById(uid)
                            .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다."));

                    // 2. 기업 객체 찾기
                    var company = companyRepository.findByCid(cid)
                            .orElseThrow(() -> new RuntimeException("기업을 찾을 수 없습니다."));

                    // 3. 빌더에 '객체'를 넣어주기!
                    CompanyScrapEntity newScrap = CompanyScrapEntity.builder()
                            .user(user)      // .uid(uid) 대신 이거!
                            .company(company) // .cid(cid) 대신 이거!
                            .build();

                    companyScrapRepository.save(newScrap);
                    return true;
                });
    }

    @Override
    public boolean isCompanyScraped(Long uid, String cid) {
        // Repository 이름 맞춰서 수정 필요
        return companyScrapRepository.existsByUser_IdAndCompany_Cid(uid, cid);
    }

    @Transactional(readOnly = true)
    @Override
    public List<CompanyScrapDto> getMyCompanyScraps(Long uid) {
        // Repository 이름 맞춰서 수정 필요
        return companyScrapRepository.findAllByUser_IdOrderByCreatedAtDesc(uid).stream()
                .map(CompanyScrapDto::fromEntity)
                .collect(Collectors.toList());
    }
}