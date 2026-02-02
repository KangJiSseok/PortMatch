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
import com.portmatch.domain.scrap.repository.ScrapRepository;
import com.portmatch.global.exception.BusinessException; // 공통 예외 추가
import com.portmatch.global.response.ResponseCode; // 공통 응답 코드 추가
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
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
    private final ScrapRepository scrapRepository;

    @Override
    @Transactional
    public JobPostingEntity saveJobPosting(JobPostingDto dto) { // void -> Entity로 변경
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

        JobPostingEntity entity = builder.build();
        return jobPostingRepository.save(entity); // 저장된 객체를 반환!
    }

    @Override
    @Transactional
    public void saveJobPostingWithStacks(JobPostingDto dto) {
        // 1. 저장된 엔티티를 직접 받아온다! (DB가 생성한 ID가 들어있음)
        JobPostingEntity jobPosting = saveJobPosting(dto);

        // 2. 이제 다시 조회할 필요 없이 바로 사용하면 돼!
        if (dto.getStackIds() != null) {
            for (Long sId : dto.getStackIds()) {
                TechStackEntity techStack = techStackRepository.findById(sId)
                        .orElseThrow(() -> new BusinessException(ResponseCode.INVALID_PARAMETER));

                PostingStackEntity psEntity = PostingStackEntity.builder()
                        .jobPosting(jobPosting) // 여기서 사용!
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
    public List<JobPostingDto> getJobsByCompanyAndActive(String companyId, int active) {
        // 1. Repository를 통해 CID와 active 상태에 맞는 엔티티 리스트 조회
        List<JobPostingEntity> entities = jobPostingRepository.findByCompanyCidAndActive(companyId, active);

        // 2. Entity 리스트를 DTO 리스트로 변환하여 반환
        return entities.stream()
                .map(this::convertToDto) // DTO에 정적 팩토리 메서드가 있다고 가정
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
    public JobPostingDto getJobDetail(Long id) {
        // 기존의 throws Exception을 제거하고 BusinessException으로 통일!
        return jobPostingRepository.findById(id)
                .map(this::convertToDto)
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));
    }

    @Override
    @Transactional
    public void deleteJobPosting(Long id) {
        // 삭제 전 존재 여부 체크 (선택사항이나 권장함)
        if (!jobPostingRepository.existsById(id)) {
            throw new BusinessException(ResponseCode.NOT_FOUND);
        }
        jobPostingRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void updateViewCount(Long id) {
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

    @Override
    public List<JobPostingDto> getHotJobPostings(int limit) {
        // 1. ScrapRepository에게 "인기 있는 공고 번호들"을 물어봐 (예: [5, 2, 10])
        // PageRequest.of(0, limit)은 "0페이지부터 limit개만큼 가져와"라는 뜻이야.
        List<Long> topPids = scrapRepository.findTopPidsByScrapCount(org.springframework.data.domain.PageRequest.of(0, limit));

        if (topPids.isEmpty()) {
            return java.util.Collections.emptyList();
        }

        // 2. 알아낸 번호들로 실제 공고 데이터(Entity)를 DB에서 긁어와
        List<JobPostingEntity> entities = jobPostingRepository.findAllByIdIn(topPids);

        // 3. 인기 순위(topPids)를 유지하면서 포장지(Dto)에 담아줘
        return topPids.stream()
                .map(id -> entities.stream()
                        .filter(entity -> entity.getId().equals(id))
                        .findFirst()
                        .orElse(null))
                .filter(java.util.Objects::nonNull) // 혹시 삭제된 공고가 있을지 모르니 체크!
                .map(this::convertToDto) // 네가 만든 기가 막힌 메서드 활용!
                .toList();
    }

    @Override
    public List<JobPostingDto> getLatestPostings(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);

        List<JobPostingEntity> entities = jobPostingRepository.findAllByOrderByIdDesc(pageable);

        return entities.stream()
                .map(this::convertToDto)
                .toList();
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