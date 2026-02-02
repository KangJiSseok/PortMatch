package com.portmatch.domain.jobposting.controller;

import com.portmatch.domain.jobposting.dto.JobPostingDto;
import com.portmatch.domain.jobposting.service.JobPostingService;
import com.portmatch.global.api.BaseApiResponse;
import com.portmatch.global.response.ResponseCode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "채용 공고", description = "채용 공고 조회 및 관리 API")
@RestController
@RequestMapping("/api/job-postings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class JobPostingController {

    private final JobPostingService jobPostingService;

    @Operation(summary = "전체 공고 목록 조회", description = "등록된 모든 채용 공고 리스트를 반환합니다.")
    @GetMapping
    public BaseApiResponse<List<JobPostingDto>> getAllJobs() {
        List<JobPostingDto> jobs = jobPostingService.getAllJobPostings();
        return BaseApiResponse.ok(jobs);
    }

    @Operation(summary = "공고 상세 조회", description = "공고 ID를 통해 상세 내용을 조회하고 조회수를 1 증가시킵니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "2001", description = "존재하지 않는 공고 ID")
    })
    @GetMapping("/{id}")
    public BaseApiResponse<JobPostingDto> getJobDetail(
            @Parameter(description = "공고 ID", example = "1") @PathVariable("id") Long id) {
        // 서비스 내부에서 BusinessException을 던지므로 try-catch가 필요 없음!
        jobPostingService.updateViewCount(id);
        JobPostingDto jobDetail = jobPostingService.getJobDetail(id);
        return BaseApiResponse.ok(jobDetail);
    }

    @Operation(summary = "새로운 공고 등록", description = "기업 ID와 기술 스택 ID 리스트를 포함하여 공고를 등록합니다.")
    @PostMapping
    public BaseApiResponse<String> createJob(@RequestBody JobPostingDto dto) {
        jobPostingService.saveJobPostingWithStacks(dto);
        return BaseApiResponse.ok("공고와 기술 스택이 성공적으로 등록되었습니다.");
    }

    @Operation(summary = "기술 스택별 필터링", description = "여러 개의 기술 스택 ID를 받아 해당 스택을 사용하는 공고를 조회합니다.")
    @GetMapping("/search-stack")
    public BaseApiResponse<List<JobPostingDto>> getJobsByStacks(
            @RequestParam("stackIds") List<Long> stackIds) {
        List<JobPostingDto> jobs = jobPostingService.getJobsByStacks(stackIds);
        return BaseApiResponse.ok(jobs);
    }

    @Operation(summary = "공고 수정", description = "기존 공고의 내용을 수정합니다.")
    @PutMapping("/{id}")
    public BaseApiResponse<String> updateJob(
            @PathVariable Long id, @RequestBody JobPostingDto dto) {
        dto.setId(id);
        jobPostingService.saveJobPosting(dto);
        return BaseApiResponse.ok("공고 정보가 수정되었습니다.");
    }

    @Operation(summary = "공고 삭제", description = "공고 ID를 통해 해당 공고를 삭제합니다.")
    @DeleteMapping("/{id}")
    public BaseApiResponse<String> deleteJob(@PathVariable Long id) {
        jobPostingService.deleteJobPosting(id);
        return BaseApiResponse.ok("공고가 삭제되었습니다.");
    }

    @Operation(summary = "기업별 공고 조회", description = "특정 기업(cid)이 등록한 모든 공고를 조회합니다.")
    @GetMapping("/company/{cid}")
    public BaseApiResponse<List<JobPostingDto>> getJobsByCompany(@PathVariable("cid") String cid) {
        List<JobPostingDto> jobs = jobPostingService.getJobsByCompany(cid);
        return BaseApiResponse.ok(jobs);
    }

    @Operation(summary = "제목 키워드 검색", description = "공고 제목에 키워드가 포함된 공고를 검색합니다.")
    @GetMapping("/search")
    public BaseApiResponse<List<JobPostingDto>> getJobsByTitle(@RequestParam("keyword") String keyword) {
        List<JobPostingDto> jobs = jobPostingService.getJobsByTitleKeyword(keyword);
        return BaseApiResponse.ok(jobs);
    }

    @Operation(summary = "인기 공고 조회", description = "스크랩 수가 많은 순서대로 공고를 가져옵니다.")
    @GetMapping("/hot")
    public BaseApiResponse<List<JobPostingDto>> getHotJobPostings(
            @RequestParam(value = "limit", defaultValue = "10") int limit) {
        List<JobPostingDto> hotJobs = jobPostingService.getHotJobPostings(limit);
        return BaseApiResponse.ok(hotJobs);
    }

    @Operation(summary = "최신 공고 목록 조회 (페이징)", description = "최근 등록된 공고부터 순서대로 조회합니다.")
    @GetMapping("/latest")
    public BaseApiResponse<List<JobPostingDto>> getLatestJobs(
            @Parameter(description = "페이지 번호 (0부터 시작)", example = "0")
            @RequestParam(value = "page", defaultValue = "0") int page,
            @Parameter(description = "한 페이지당 개수", example = "10")
            @RequestParam(value = "size", defaultValue = "10") int size) {

        List<JobPostingDto> latestJobs = jobPostingService.getLatestPostings(page, size);
        return BaseApiResponse.ok(latestJobs);
    }
}
