package com.portmatch.domain.jobposting.service;

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

    @Override
    @Transactional
    public void saveJobPosting(JobPostingDto dto) {
        // ID가 같으면 Update, 없으면 Insert (Upsert 방식)
        JobPostingEntity entity = JobPostingEntity.builder()
                .id(dto.getId())
                .title(dto.getTitle())
                .active(dto.getActive())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .cid(dto.getCid())
                .detail(dto.getDetail())
                .jobType(dto.getJobType())
                .vcnt(dto.getVcnt()) // null 체크
                .build();

        jobPostingRepository.save(entity);
    }

    @Override
    public List<JobPostingDto> getAllJobPostings() {
        // DB의 모든 공고를 가져와서 DTO 리스트로 변환
        return jobPostingRepository.findAll().stream()
                .map(this::convertToDto)
                .toList();
    }

    @Override
    public JobPostingDto getJobDetail(String id) throws Exception {
        // 상세 조회: 없으면 에러 던지기
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
        // 조회수 증가 로직
        jobPostingRepository.findById(id).ifPresent(entity -> {
            // 기존 엔티티의 값을 하나 올린 뒤 save (더티 체킹 활용 가능)
            JobPostingEntity updated = JobPostingEntity.builder()
                    .id(entity.getId())
                    .title(entity.getTitle())
                    .active(entity.getActive())
                    .startDate(entity.getStartDate())
                    .endDate(entity.getEndDate())
                    .cid(entity.getCid())
                    .detail(entity.getDetail())
                    .jobType(entity.getJobType())
                    .vcnt(entity.getVcnt() + 1) // 조회수 +1
                    .build();
            jobPostingRepository.save(updated);
        });
    }

    // Entity를 DTO로 변환하는 로직 (기존 코드 유지)
    private JobPostingDto convertToDto(JobPostingEntity entity) {
        return JobPostingDto.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .active(entity.getActive())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .cid(entity.getCid())
                .detail(entity.getDetail())
                .jobType(entity.getJobType())
                .vcnt(entity.getVcnt())
                .build();
    }
}