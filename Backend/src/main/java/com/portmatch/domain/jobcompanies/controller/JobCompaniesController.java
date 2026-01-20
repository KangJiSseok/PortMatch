package com.portmatch.domain.jobcompanies.controller;

import com.portmatch.domain.jobcompanies.dto.JobCompaniesDto;
import com.portmatch.domain.jobcompanies.service.JobCompaniesService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class JobCompaniesController {

    private final JobCompaniesService jobCompaniesService;

    // 0. 새로운 기업 정보 입력 (CREATE)
    @PostMapping
    public ResponseEntity<String> createCompany(@RequestBody JobCompaniesDto dto) {
        log.info("새로운 기업 생성 요청: {}", dto.getCorpName());

        if (dto.getCorpName() == null || dto.getCorpName().isEmpty()) {
            return ResponseEntity.badRequest().body("기업명이 누락되었습니다.");
        }

        try {
            jobCompaniesService.createCompany(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body("기업 입력이 성공적으로 완료되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("저장 중 오류 발생: " + e.getMessage());
        }
    }

    // 1. 전체 기업 리스트 조회
    @GetMapping
    public ResponseEntity<List<JobCompaniesDto>> getAllCompanys() {
        log.info("전체 기업 리스트 조회 요청");
        List<JobCompaniesDto> companyList = jobCompaniesService.getAllCompanys();
        return ResponseEntity.ok(companyList);
    }

    // 2. [추가] 특정 기업 상세 조회 (이게 있어야 하나씩 볼 수 있어!)
    @GetMapping("/{cid}")
    public ResponseEntity<JobCompaniesDto> getCompany(@PathVariable String cid) {
        log.info("기업 상세 조회 요청: {}", cid);
        JobCompaniesDto dto = jobCompaniesService.getCompany(cid);
        return ResponseEntity.ok(dto);
    }

    // 3. 기업 정보 수정 (ID를 경로에서 받도록 수정!)
    @PutMapping("/{cid}")
    public ResponseEntity<String> updateCompany(@PathVariable String cid, @RequestBody JobCompaniesDto dto) {
        log.info("기업 수정 요청 - ID: {}", cid);

        // 경로의 ID를 DTO에도 세팅해주는 게 안전해
        dto.setCid(cid);

        try {
            jobCompaniesService.updateCompany(dto);
            return ResponseEntity.ok("기업 ID [" + cid + "]의 정보가 성공적으로 수정되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("수정 중 오류 발생: " + e.getMessage());
        }
    }

    // 4. 기업 정보 삭제
    @DeleteMapping("/{cid}")
    public ResponseEntity<String> deleteCompany(@PathVariable String cid) {
        log.info("기업 삭제 요청: {}", cid);
        try {
            jobCompaniesService.deleteCompany(cid);
            return ResponseEntity.ok("기업 삭제가 성공적으로 이루어졌습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("존재하지 않는 기업입니다.");
        }
    }
}