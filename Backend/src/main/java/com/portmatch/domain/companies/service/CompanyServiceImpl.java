package com.portmatch.domain.companies.service;

import com.portmatch.domain.companies.dto.CompaniesDto;
import com.portmatch.domain.companies.entity.Company;
import com.portmatch.domain.companies.repository.CompanyRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CompanyServiceImpl implements CompaniesService {

    private final CompanyRepository companyRepository;

    @Override
    @Transactional
    public void createCompany(CompaniesDto dto) {
        // 중복 방지를 위해 이미 존재하는지 확인 로직을 넣으면 더 안전해!
        if (companyRepository.existsByCid(dto.getCid())) {
            return;
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
        companyRepository.deleteByCid(cid);
    }

    @Override
    public List<CompaniesDto> getAllCompanys() {
        return companyRepository.findAll().stream()
                .filter(company -> company.getCid() != null)
                .map(this::convertToDto) // 변환 로직 분리
                .toList();
    }

    @Override
    @Transactional
    public void updateCompany(CompaniesDto dto) {
        companyRepository.findByCid(dto.getCid()).ifPresent(company -> company.updateJobCompany(
                dto.getCorpName(),
                dto.getCorpAddr(),
                dto.getBusiSize(),
                dto.getHomePg(),
                dto.getTotPsncnt(),
                dto.getYrSalesAmt(),
                dto.getBusiCont(),
                dto.getLogo()
        ));
    }

    @Override
    public CompaniesDto getCompany(String cid) {
        return companyRepository.findByCid(cid)
                .map(this::convertToDto)
                .orElse(null);
    }

    // Entity -> DTO 변환 편의 메서드
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
