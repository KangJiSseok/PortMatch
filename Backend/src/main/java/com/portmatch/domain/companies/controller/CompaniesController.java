package com.portmatch.domain.companies.controller;

import com.portmatch.domain.companies.dto.CompaniesDto;
import com.portmatch.domain.companies.service.CompaniesService;
import com.portmatch.global.api.BaseApiResponse;
import com.portmatch.global.response.ResponseCode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "기업 관리", description = "기업 정보 등록, 조회, 수정, 삭제를 담당하는 API입니다.")
@Slf4j
@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CompaniesController {

    private final CompaniesService jobCompaniesService;

    @Operation(summary = "새로운 기업 등록", description = "기업 정보를 입력받아 데이터베이스에 저장합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "등록 성공"),
            @ApiResponse(responseCode = "2002", description = "기업명 누락 등 파라미터 오류", content = @Content)
    })
    @PostMapping
    public BaseApiResponse<String> createCompany(@RequestBody CompaniesDto dto) {
        log.info("새로운 기업 생성 요청: {}", dto.getCorpName());

        if (dto.getCorpName() == null || dto.getCorpName().isEmpty()) {
            return BaseApiResponse.error(ResponseCode.INVALID_PARAMETER.getCode(), "기업명이 누락되었습니다.");
        }

        jobCompaniesService.createCompany(dto);
        return BaseApiResponse.ok("기업 입력이 성공적으로 완료되었습니다.");
    }

    @Operation(summary = "전체 기업 리스트 조회", description = "등록된 모든 기업의 정보를 리스트 형태로 반환합니다.")
    @ApiResponse(responseCode = "200", description = "조회 성공")
    @GetMapping
    public BaseApiResponse<List<CompaniesDto>> getAllCompanys() {
        log.info("전체 기업 리스트 조회 요청");
        List<CompaniesDto> companyList = jobCompaniesService.getAllCompanys();
        return BaseApiResponse.ok(companyList);
    }

    @Operation(summary = "특정 기업 상세 조회", description = "기업 ID(cid)를 이용해 특정 기업의 상세 정보를 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "2403", description = "해당 사용자를 찾을 수 없음", content = @Content)
    })
    @GetMapping("/{cid}")
    public BaseApiResponse<CompaniesDto> getCompany(
            @Parameter(description = "조회할 기업의 ID", example = "12345") @PathVariable String cid) {
        log.info("기업 상세 조회 요청: {}", cid);
        CompaniesDto dto = jobCompaniesService.getCompany(cid);

        if (dto == null) {
            return BaseApiResponse.error(ResponseCode.USER_NOT_FOUND);
        }

        return BaseApiResponse.ok(dto);
    }

    @Operation(summary = "기업 정보 수정", description = "기존 기업의 정보를 업데이트합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "수정 성공"),
            @ApiResponse(responseCode = "9000", description = "서버 내부 오류", content = @Content)
    })
    @PutMapping("/{cid}")
    public BaseApiResponse<String> updateCompany(
            @Parameter(description = "수정할 기업의 ID", example = "12345") @PathVariable String cid,
            @RequestBody CompaniesDto dto) {
        log.info("기업 수정 요청 - ID: {}", cid);
        dto.setCid(cid);

        try {
            jobCompaniesService.updateCompany(dto);
            return BaseApiResponse.ok("기업 정보가 수정되었습니다.");
        } catch (Exception e) {
            return BaseApiResponse.error(ResponseCode.INTERNAL_SERVER_ERROR.getCode(), e.getMessage());
        }
    }

    @Operation(summary = "기업 정보 삭제", description = "기업 ID(cid)를 이용해 해당 기업 정보를 삭제합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "삭제 성공"),
            @ApiResponse(responseCode = "2001", description = "존재하지 않는 URL 또는 리소스", content = @Content)
    })
    @DeleteMapping("/{cid}")
    public BaseApiResponse<String> deleteCompany(
            @Parameter(description = "삭제할 기업의 ID", example = "12345") @PathVariable String cid) {
        log.info("기업 삭제 요청: {}", cid);
        try {
            jobCompaniesService.deleteCompany(cid);
            return BaseApiResponse.ok("기업 삭제가 완료되었습니다.");
        } catch (Exception e) {
            return BaseApiResponse.error(ResponseCode.NOT_FOUND);
        }
    }
}