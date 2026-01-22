package com.portmatch.domain.jobposting.controller;

import com.portmatch.domain.jobposting.dto.JobPostingDto;
import com.portmatch.domain.jobposting.service.JobPostingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/job-postings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class JobPostingController {

    private final JobPostingService jobPostingService;

    // 1. 전체 공고 목록 조회
    @GetMapping
    public ResponseEntity<List<JobPostingDto>> getAllJobs() {
        log.info("모든 채용 공고 조회 요청");
        List<JobPostingDto> jobs = jobPostingService.getAllJobPostings();
        return ResponseEntity.ok(jobs);
    }

    // 2. 공고 상세 조회 (+ 조회수 증가)
    @GetMapping("/{id}")
    public ResponseEntity<JobPostingDto> getJobDetail(@PathVariable("id") String id) {
        log.info("공고 상세 조회 요청 - ID: {}", id);
        try {
            jobPostingService.updateViewCount(id);
            JobPostingDto jobDetail = jobPostingService.getJobDetail(id);
            return ResponseEntity.ok(jobDetail);
        } catch (Exception e) {
            log.error("공고 상세 조회 중 오류 발생 (ID: {}): ", id, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    // 3. 새로운 공고 수동 등록 (스택 포함)
    @PostMapping
    public ResponseEntity<String> createJob(@RequestBody JobPostingDto dto) {
        log.info("새로운 공고 등록 요청(스택 포함): {}", dto.getTitle());
        // 기존 saveJobPosting 대신 스택까지 처리하는 메서드 호출
        jobPostingService.saveJobPostingWithStacks(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body("공고와 기술 스택이 성공적으로 등록되었습니다.");
    }

    // [추가] 6. 기술 스택별 공고 필터링 조회
    @GetMapping("/search")
    public ResponseEntity<List<JobPostingDto>> getJobsByStack(@RequestParam("stackId") Long stackId) {
        log.info("기술 스택 필터링 조회 요청 - Stack ID: {}", stackId);
        List<JobPostingDto> jobs = jobPostingService.getJobsByStack(stackId);
        return ResponseEntity.ok(jobs);
    }

    // 4. 공고 수정
    @PutMapping("/{id}")
    public ResponseEntity<String> updateJob(@PathVariable String id, @RequestBody JobPostingDto dto) {
        log.info("공고 수정 요청 - ID: {}", id);
        dto.setId(id);
        jobPostingService.saveJobPosting(dto);
        return ResponseEntity.ok("공고 정보가 수정되었습니다.");
    }

    // 5. 공고 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteJob(@PathVariable String id) {
        log.info("공고 삭제 요청 - ID: {}", id);
        jobPostingService.deleteJobPosting(id);
        return ResponseEntity.ok("공고가 삭제되었습니다.");
    }
}