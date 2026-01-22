package com.portmatch.domain.jobposting.controller;

import com.portmatch.domain.jobposting.dto.TechStackDto;
import com.portmatch.domain.jobposting.entity.PostingStackEntity;
import com.portmatch.domain.jobposting.service.StackService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/stacks")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // 프론트엔드 연결을 위한 설정
public class StackController {

    private final StackService stackService;

    // 1. 전체 기술 스택 목록 조회
    @GetMapping
    public ResponseEntity<List<TechStackDto>> getAllStacks() {
        log.info("전체 기술 스택 목록 조회 요청");
        List<TechStackDto> stacks = stackService.getAllTechStacks();
        return ResponseEntity.ok(stacks);
    }

    // 2. 특정 공고에 포함된 스택 리스트 조회
    @GetMapping("/posting/{postingId}")
    public ResponseEntity<List<TechStackDto>> getStacksByPosting(@PathVariable String postingId) {
        log.info("공고별 스택 조회 요청 - 공고 ID: {}", postingId);
        List<TechStackDto> stacks = stackService.getPostingStacks(postingId);
        return ResponseEntity.ok(stacks);
    }

    // 3. 마스터 기술 스택 새롭게 등록 (관리자용)
    @PostMapping
    public ResponseEntity<String> createStack(@RequestParam String stackName) {
        log.info("새로운 기술 스택 등록 요청: {}", stackName);
        stackService.createStack(stackName);
        return ResponseEntity.status(HttpStatus.CREATED).body("기술 스택이 등록되었습니다.");
    }

    @GetMapping("/{id}")
    public ResponseEntity<TechStackDto> getStackById(@PathVariable Long id) {
        log.info("stack id로 기술 스택 조회");
        TechStackDto stack = stackService.getTechStackById(id);
        return ResponseEntity.ok(stack);
    }
}