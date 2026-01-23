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
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class JobPostingServiceImpl implements JobPostingService {

    private final JobPostingRepository jobPostingRepository;
    private final CompanyRepository jobCompaniesRepository; // 기업 레포지토리 추가!
    private final TechStackRepository techStackRepository;
    private final PostingStackRepository postingStackRepository;
    private final CompaniesService companiesService;

    @Override
    @Transactional
    public void saveJobPosting(JobPostingDto dto) {
        // 1. DTO에 담긴 cid로 실제 기업 엔티티를 조회해와야 해.
        Company company = jobCompaniesRepository.findByCid(dto.getCid())
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
    @Transactional
    public void saveJobPostingWithStacks(JobPostingDto dto) {
        // 1. 공고 정보 저장 (saveJobPosting 메서드 내부에서 기업 조회 및 저장을 다 처리함)
        saveJobPosting(dto);

        // 2. 방금 저장한 공고 가져오기 (ID가 String인 점 주의!)
        JobPostingEntity jobPosting = jobPostingRepository.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("공고를 찾을 수 없습니다."));

        // 3. 스택 연결 저장
        if (dto.getStackIds() != null) {
            for (Long sId : dto.getStackIds()) {
                // TechStackEntity 조회 (ID가 Long인 점 주의!)
                TechStackEntity techStack = techStackRepository.findById(sId)
                        .orElseThrow(() -> new RuntimeException("존재하지 않는 스택 ID: " + sId));

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
        // 1. 선택한 스택 ID들에 해당하는 중간 테이블 엔티티들을 가져옴
        List<PostingStackEntity> postingStacks = postingStackRepository.findByTechStackIdIn(stackIds);

        // 2. 중복 제거를 위해 Stream 사용 (공고 ID 기준)
        return postingStacks.stream()
                .map(PostingStackEntity::getJobPosting) // 공고 엔티티 추출
                .distinct()                            // 중복된 공고 제거
                .map(this::convertToDto)               // DTO 변환
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
        List<Long> stackIds = null;
        if (entity.getTechStacks() != null) {
            stackIds = entity.getTechStacks().stream()
                    .map(ps -> ps.getTechStack().getId()) // 중간 엔티티를 거쳐 실제 스택 ID 가져오기
                    .toList();
        }
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
                .company(entity.getCompany() != null ? companiesService.getCompany(entity.getCompany().getCid()) : null)
                .stackIds(stackIds)
                .build();
    }
}