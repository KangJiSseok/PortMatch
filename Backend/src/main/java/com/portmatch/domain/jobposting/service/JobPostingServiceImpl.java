package com.portmatch.domain.jobposting.service;

import com.portmatch.domain.companies.entity.Company;
import com.portmatch.domain.companies.repository.CompanyRepository;
import com.portmatch.domain.companies.service.CompaniesService;
import com.portmatch.domain.jobposting.dto.JobPostingDto;
import com.portmatch.domain.jobposting.entity.JobPostingEntity;
import com.portmatch.domain.jobposting.entity.PostingStackEntity;
import com.portmatch.domain.jobposting.entity.TechStackEntity;
import com.portmatch.domain.jobposting.repository.JobPostingRepository;
import com.portmatch.domain.jobposting.repository.PostingStackRepository;
import com.portmatch.domain.jobposting.repository.TechStackRepository;
import com.portmatch.global.exception.BusinessException; // 공통 예외 추가
import com.portmatch.global.response.ResponseCode; // 공통 응답 코드 추가
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class JobPostingServiceImpl implements JobPostingService {

    private final JobPostingRepository jobPostingRepository;
    private final CompanyRepository jobCompaniesRepository;
    private final TechStackRepository techStackRepository;
    private final PostingStackRepository postingStackRepository;
    private final CompaniesService companiesService;

    // --- 저장/수정 로직 (기존 유지) ---
    @Override
    @Transactional
    public JobPostingEntity saveJobPosting(JobPostingDto dto) {
        Company company = jobCompaniesRepository.findByCid(dto.getCid())
                .orElseThrow(() -> new BusinessException(ResponseCode.USER_NOT_FOUND));

        JobPostingEntity.JobPostingEntityBuilder builder = JobPostingEntity.builder()
                .title(dto.getTitle())
                .active(dto.getActive())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .company(company)
                .detail(dto.getDetail())
                .jobType(dto.getJobType())
                .vcnt(dto.getVcnt());

        if (dto.getId() != null && dto.getId() > 0) {
            builder.id(dto.getId());
        }

        return jobPostingRepository.save(builder.build());
    }

    @Override
    @Transactional
    public void saveJobPostingWithStacks(JobPostingDto dto) {
        JobPostingEntity jobPosting = saveJobPosting(dto);
        if (dto.getStackIds() != null) {
            for (Long sId : dto.getStackIds()) {
                TechStackEntity techStack = techStackRepository.findById(sId)
                        .orElseThrow(() -> new BusinessException(ResponseCode.INVALID_PARAMETER));

                PostingStackEntity psEntity = PostingStackEntity.builder()
                        .jobPosting(jobPosting)
                        .techStack(techStack)
                        .build();
                postingStackRepository.save(psEntity);
            }
        }
    }

    // --- 조회 로직 (Pageable 적용 및 중복 해결) ---

    // 1. 전체 조회 (페이징)
    @Override
    public Page<JobPostingDto> getAllJobPostings(Pageable pageable) {
        return jobPostingRepository.findAll(pageable)
                .map(this::convertToDto);
    }

    // 2. 제목 검색 (페이징)
    @Override
    public Page<JobPostingDto> getJobsByTitleKeyword(String keyword, Pageable pageable) {
        return jobPostingRepository.findByTitleContaining(keyword, pageable)
                .map(this::convertToDto);
    }

    // 3. 기업별 조회 (페이징)
    @Override
    public Page<JobPostingDto> getJobsByCompany(String companyId, Pageable pageable) {
        return jobPostingRepository.findByCompanyCid(companyId, pageable)
                .map(this::convertToDto);
    }

    // 4. 기술 스택별 조회 (페이징 + 중복 제거) ⭐ 핵심 수정 포인트!
    @Override
    public Page<JobPostingDto> getJobsByStacks(List<Long> stackIds, Pageable pageable) {
        // PostingStackRepository 대신 JobPostingRepository의 커스텀 쿼리를 호출해!
        // 그래야 DISTINCT가 적용되어 중복 공고가 안 나와.
        return postingStackRepository.findByStackIds(stackIds, pageable)
                .map(this::convertToDto);
    }

    // --- 상세 및 기타 로직 (기존 유지) ---
    @Override
    public JobPostingDto getJobDetail(Long id) {
        return jobPostingRepository.findById(id)
                .map(this::convertToDto)
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));
    }

    @Override
    @Transactional
    public void deleteJobPosting(Long id) {
        if (!jobPostingRepository.existsById(id)) {
            throw new BusinessException(ResponseCode.NOT_FOUND);
        }
        jobPostingRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void updateViewCount(Long id) {
        JobPostingEntity entity = jobPostingRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));

        // vcnt만 업데이트하는 방식 (Dirty Checking 이용 시 더 깔끔하지만 일단 유지)
        JobPostingEntity updated = JobPostingEntity.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .active(entity.getActive())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .company(entity.getCompany())
                .detail(entity.getDetail())
                .jobType(entity.getJobType())
                .vcnt(entity.getVcnt() + 1)
                .build();
        jobPostingRepository.save(updated);
    }

    // DTO 변환 로직
    private JobPostingDto convertToDto(JobPostingEntity entity) {
        List<Long> stackIds = null;
        if (entity.getTechStacks() != null) {
            stackIds = entity.getTechStacks().stream()
                    .map(ps -> ps.getTechStack().getId())
                    .toList();
        }
        return JobPostingDto.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .active(entity.getActive())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .cid(entity.getCompany() != null ? entity.getCompany().getCid() : null)
                .detail(entity.getDetail())
                .jobType(entity.getJobType())
                .vcnt(entity.getVcnt())
                .company(entity.getCompany() != null ? companiesService.getCompany(entity.getCompany().getCid()) : null)
                .stackIds(stackIds)
                .build();
    }
}