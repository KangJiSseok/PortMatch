package com.portmatch.domain.companies.service;

import com.portmatch.domain.companies.dto.CompaniesDto;
import com.portmatch.domain.companies.dto.CompanyNameResponse;
import com.portmatch.domain.companies.entity.Company;
import com.portmatch.domain.companies.repository.CompanyRepository;
import com.portmatch.domain.jobposting.repository.JobPostingRepository;
import com.portmatch.global.exception.BusinessException; // 공통 예외
import com.portmatch.global.response.ResponseCode; // 공통 코드
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CompanyServiceImpl implements CompaniesService {

    private final CompanyRepository companyRepository;
    private final JobPostingRepository jobPostingRepository;

    @Override
    @Transactional
    public void createCompany(CompaniesDto dto) {
        // 중복 방지: 이미 존재하면 에러를 던져서 알림
        if (companyRepository.existsByCid(dto.getCid())) {
            throw new BusinessException(ResponseCode.DUPLICATE_EMAIL); // 적절한 중복 코드가 없다면 추가하거나 DUPLICATE_EMAIL 활용
        }

        Company company = new Company(
                dto.getCid(),
                dto.getCorpName(),
                dto.getCorpAddr(),
                dto.getBusiSize(),
                dto.getHomePg(),
                dto.getTotPsncnt(),
                dto.getYrSalesAmt(),
                dto.getBusiCont(),
                dto.getLogo()
        );
        companyRepository.save(company);
    }

    @Override
    @Transactional
    public void deleteCompany(String cid) {
        // 삭제할 대상이 없으면 에러 던지기
        Company company = companyRepository.findByCid(cid)
                .orElseThrow(() -> new BusinessException(ResponseCode.USER_NOT_FOUND));

        companyRepository.delete(company);
    }

    @Override
    public List<CompaniesDto> getAllCompanys() {
        List<CompaniesDto> list = companyRepository.findAll().stream()
                .filter(company -> company.getCid() != null)
                .map(this::convertToDto)
                .toList();

        // 만약 리스트가 비어있는 게 에러라고 판단된다면 에러를 던질 수도 있어 (선택사항)
        return list;
    }

    @Override
    public List<CompanyNameResponse> getCompanyByName(String keyword) {
        List<Company> companies = companyRepository.findByCompaniesNameContaining(keyword);

        return companies.stream()
                .map(company -> {
                    // 1. 리포지토리에서 List<Object[]> 형태로 데이터를 가져옴
                    List<Object[]> jobObjects = jobPostingRepository.findTop3JobIdsAndTitlesByCid(
                            company.getCid(),
                            PageRequest.of(0, 3)
                    );

                    // 2. Object 배열에서 데이터를 꺼내 JobSummary 객체로 변환
                    List<CompanyNameResponse.JobSummary> recentJobs = jobObjects.stream()
                            .map(obj -> CompanyNameResponse.JobSummary.builder()
                                    .id((Long) obj[0])     // 쿼리에서 SELECT j.id 가 첫 번째(0)
                                    .title((String) obj[1]) // 쿼리에서 SELECT j.title 이 두 번째(1)
                                    .build())
                            .toList();

                    // 3. 최종 DTO 조립
                    return CompanyNameResponse.builder()
                            .cid(company.getCid())
                            .corpName(company.getCompaniesName())
                            .totPsncnt(company.getTotPsncnt())
                            .busiSize(company.getSize())
                            .corpAddr(company.getAddress())
                            .homePg(company.getHomepageUrl())
                            .logo(company.getLogo())
                            .recentJob(recentJobs) // DTO의 필드명에 맞춰서 넣어줘! (recentJobs 또는 recentJobTitles)
                            .build();
                })
                .toList();
    }

    @Override
    @Transactional
    public void updateCompany(CompaniesDto dto) {
        // 수정할 대상이 없으면 에러 던지기
        Company company = companyRepository.findByCid(dto.getCid())
                .orElseThrow(() -> new BusinessException(ResponseCode.USER_NOT_FOUND));

        company.updateJobCompany(
                dto.getCorpName(),
                dto.getCorpAddr(),
                dto.getBusiSize(),
                dto.getHomePg(),
                dto.getTotPsncnt(),
                dto.getYrSalesAmt(),
                dto.getBusiCont(),
                dto.getLogo()
        );
    }

    @Override
    public CompaniesDto getCompany(String cid) {
        // orElse(null) 대신 orElseThrow 사용!
        return companyRepository.findByCid(cid)
                .map(this::convertToDto)
                .orElseThrow(() -> new BusinessException(ResponseCode.USER_NOT_FOUND));
    }

    private CompaniesDto convertToDto(Company entity) {
        return CompaniesDto.builder()
                .cid(entity.getCid())
                .corpName(entity.getCompaniesName())
                .totPsncnt(entity.getTotPsncnt())
                .busiSize(entity.getSize())
                .yrSalesAmt(entity.getYrSalesAmt())
                .corpAddr(entity.getAddress())
                .homePg(entity.getHomepageUrl())
                .busiCont(entity.getBusiCont())
                .logo(entity.getLogo())
                .build();
    }
}