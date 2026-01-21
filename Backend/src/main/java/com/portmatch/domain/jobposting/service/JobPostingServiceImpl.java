package com.portmatch.domain.jobposting.service;

import com.portmatch.domain.jobcompanies.entity.JobCompaniesEntity;
import com.portmatch.domain.jobcompanies.repository.JobCompaniesRepository;
import com.portmatch.domain.jobposting.dto.JobPostingDto;
import com.portmatch.domain.jobposting.entity.JobPostingEntity;
import com.portmatch.domain.jobposting.repository.JobPostingRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class JobPostingServiceImpl implements JobPostingService {

    private final JobPostingRepository jobPostingRepository;
    private final JobCompaniesRepository jobCompaniesRepository; // 기업 레포지토리 추가!

    @Override
    @Transactional
    public void saveJobPosting(JobPostingDto dto) {
        // 1. DTO에 담긴 cid로 실제 기업 엔티티를 조회해와야 해.
        JobCompaniesEntity company = jobCompaniesRepository.findById(dto.getCid())
                .orElseThrow(() -> new RuntimeException("존재하지 않는 기업 ID입니다: " + dto.getCid()));

        // 2. 이제 cid 대신 .company(company)로 객체를 넣어줘!
        JobPostingEntity entity = JobPostingEntity.builder()
                .id(dto.getId())
                .title(dto.getTitle())
                .active(dto.getActive())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .company(company) // String cid 대신 Entity 객체 주입
                .detail(dto.getDetail())
                .jobType(dto.getJobType())
                .vcnt(dto.getVcnt())
                .build();

        jobPostingRepository.save(entity);
    }

    @Override
    public List<JobPostingDto> getAllJobPostings() {
        return jobPostingRepository.findAll().stream()
                .map(this::convertToDto)
                .toList();
    }

    @Override
    public JobPostingDto getJobDetail(String id) throws Exception {
        return jobPostingRepository.findById(id)
                .map(this::convertToDto)
                .orElseThrow(() -> new Exception("해당 공고를 찾을 수 없습니다. ID: " + id));
    }

    @Override
    @Transactional
    public void deleteJobPosting(String id) {
        jobPostingRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void updateViewCount(String id) {
        jobPostingRepository.findById(id).ifPresent(entity -> {
            // 더티 체킹(Dirty Checking)을 쓰고 싶다면 필드만 수정해도 되지만,
            // 현재 빌더 패턴을 쓰고 있으니 아래처럼 명시적으로 업데이트해줄 수 있어.
            JobPostingEntity updated = JobPostingEntity.builder()
                    .id(entity.getId())
                    .title(entity.getTitle())
                    .active(entity.getActive())
                    .startDate(entity.getStartDate())
                    .endDate(entity.getEndDate())
                    .company(entity.getCompany()) // 기존 기업 정보 유지
                    .detail(entity.getDetail())
                    .jobType(entity.getJobType())
                    .vcnt(entity.getVcnt() + 1)
                    .build();
            jobPostingRepository.save(updated);
        });
    }

    private JobPostingDto convertToDto(JobPostingEntity entity) {
        return JobPostingDto.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .active(entity.getActive())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .cid(entity.getCompany() != null ? entity.getCompany().getCid() : null) // 객체에서 ID 추출
                .detail(entity.getDetail())
                .jobType(entity.getJobType())
                .vcnt(entity.getVcnt())
                .build();
    }
}