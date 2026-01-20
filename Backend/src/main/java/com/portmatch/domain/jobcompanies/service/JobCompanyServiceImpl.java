package com.portmatch.domain.jobcompanies.service;

import com.portmatch.domain.jobcompanies.dto.JobCompaniesDto;
import com.portmatch.domain.jobcompanies.entity.JobCompaniesEntity;
import com.portmatch.domain.jobcompanies.repository.JobCompaniesRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class JobCompanyServiceImpl implements JobCompaniesService {

    private final JobCompaniesRepository jobCompaniesRepository;

    @Override
    @Transactional
    public void createCompany(JobCompaniesDto dto) {
        // 중복 방지를 위해 이미 존재하는지 확인 로직을 넣으면 더 안전해!
        if (jobCompaniesRepository.existsById(dto.getCid())) {
            return;
        }

        JobCompaniesEntity entity = JobCompaniesEntity.builder()
                .cid(dto.getCid())
                .corpName(dto.getCorpName())
                .totPsncnt(dto.getTotPsncnt())
                .busiSize(dto.getBusiSize())
                .yrSalesAmt(dto.getYrSalesAmt())
                .corpAddr(dto.getCorpAddr())
                .homePg(dto.getHomePg())
                .busiCont(dto.getBusiCont())
                .logo(dto.getLogo())
                .build();
        jobCompaniesRepository.save(entity);
    }

    @Override
    @Transactional
    public void deleteCompany(String cid) {
        jobCompaniesRepository.deleteById(cid);
    }

    @Override
    public List<JobCompaniesDto> getAllCompanys() {
        return jobCompaniesRepository.findAll().stream()
                .map(this::convertToDto) // 변환 로직 분리
                .toList();
    }

    @Override
    @Transactional
    public void updateCompany(JobCompaniesDto dto) {
        jobCompaniesRepository.findById(dto.getCid()).ifPresent(entity -> {
            JobCompaniesEntity updatedEntity = JobCompaniesEntity.builder()
                    .cid(dto.getCid())
                    .corpName(dto.getCorpName())
                    .totPsncnt(dto.getTotPsncnt())
                    .busiSize(dto.getBusiSize())
                    .yrSalesAmt(dto.getYrSalesAmt())
                    .corpAddr(dto.getCorpAddr())
                    .homePg(dto.getHomePg())
                    .busiCont(dto.getBusiCont())
                    .logo(dto.getLogo())
                    .build();
            jobCompaniesRepository.save(updatedEntity);
        });
    }

    @Override
    public JobCompaniesDto getCompany(String cid) {
        return jobCompaniesRepository.findById(cid)
                .map(this::convertToDto)
                .orElse(null);
    }

    // Entity -> DTO 변환 편의 메서드
    private JobCompaniesDto convertToDto(JobCompaniesEntity entity) {
        return JobCompaniesDto.builder()
                .cid(entity.getCid())
                .corpName(entity.getCorpName())
                .totPsncnt(entity.getTotPsncnt())
                .busiSize(entity.getBusiSize())
                .yrSalesAmt(entity.getYrSalesAmt())
                .corpAddr(entity.getCorpAddr())
                .homePg(entity.getHomePg())
                .busiCont(entity.getBusiCont())
                .logo(entity.getLogo())
                .build();
    }
}