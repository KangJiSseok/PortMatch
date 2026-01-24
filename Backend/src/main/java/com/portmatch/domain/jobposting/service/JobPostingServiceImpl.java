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

    @Override
    @Transactional
    public void saveJobPosting(JobPostingDto dto) {
        // 기업이 없는 경우 USER_NOT_FOUND (또는 COMPANY_NOT_FOUND 추가해서 사용)
        Company company = jobCompaniesRepository.findByCid(dto.getCid())
                .orElseThrow(() -> new BusinessException(ResponseCode.USER_NOT_FOUND));

        JobPostingEntity entity = JobPostingEntity.builder()
                .id(dto.getId())
                .title(dto.getTitle())
                .active(dto.getActive())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .company(company)
                .detail(dto.getDetail())
                .jobType(dto.getJobType())
                .vcnt(dto.getVcnt())
                .build();

        jobPostingRepository.save(entity);
    }

    @Override
    @Transactional
    public void saveJobPostingWithStacks(JobPostingDto dto) {
        saveJobPosting(dto);

        // 공고가 안 만들어졌다면 서버 에러 혹은 데이터 누락 에러
        JobPostingEntity jobPosting = jobPostingRepository.findById(dto.getId())
                .orElseThrow(() -> new BusinessException(ResponseCode.INTERNAL_SERVER_ERROR));

        if (dto.getStackIds() != null) {
            for (Long sId : dto.getStackIds()) {
                // 스택 ID가 잘못된 경우 INVALID_PARAMETER 활용
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

    @Override
    public List<JobPostingDto> getJobsByStacks(List<Long> stackIds) {
        List<PostingStackEntity> postingStacks = postingStackRepository.findByTechStackIdIn(stackIds);

        return postingStacks.stream()
                .map(PostingStackEntity::getJobPosting)
                .distinct()
                .map(this::convertToDto)
                .toList();
    }

    @Override
    public List<JobPostingDto> getJobsByCompany(String companyId) {
        return jobPostingRepository.findByCompanyCid(companyId).stream()
                .map(this::convertToDto)
                .toList();
    }

    @Override
    public List<JobPostingDto> getJobsByTitleKeyword(String keyword) {
        return jobPostingRepository.findByTitleContaining(keyword).stream()
                .map(this::convertToDto)
                .toList();
    }

    @Override
    public List<JobPostingDto> getAllJobPostings() {
        return jobPostingRepository.findAll().stream()
                .map(this::convertToDto)
                .toList();
    }

    @Override
    public JobPostingDto getJobDetail(String id) {
        // 기존의 throws Exception을 제거하고 BusinessException으로 통일!
        return jobPostingRepository.findById(id)
                .map(this::convertToDto)
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));
    }

    @Override
    @Transactional
    public void deleteJobPosting(String id) {
        // 삭제 전 존재 여부 체크 (선택사항이나 권장함)
        if (!jobPostingRepository.existsById(id)) {
            throw new BusinessException(ResponseCode.NOT_FOUND);
        }
        jobPostingRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void updateViewCount(String id) {
        // 수정할 대상이 없으면 조용히 넘어가거나 에러를 던질 수 있어
        JobPostingEntity entity = jobPostingRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));

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