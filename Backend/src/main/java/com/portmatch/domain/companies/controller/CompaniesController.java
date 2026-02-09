package com.portmatch.domain.companies.controller;

import com.portmatch.domain.companies.dto.CompaniesDto;
import com.portmatch.domain.companies.dto.CompanyNameResponse;
import com.portmatch.domain.companies.service.CompaniesService;
import com.portmatch.domain.companyproject.dto.CompanyProjectReplaceRequest;
import com.portmatch.domain.companyproject.dto.CompanyProjectResponse;
import com.portmatch.domain.companyproject.service.CompanyProjectAnalysisService;
import com.portmatch.domain.companies.entity.Company;
import com.portmatch.domain.companies.repository.CompanyRepository;
import com.portmatch.domain.auth.enums.Role;
import com.portmatch.domain.auth.security.UserPrincipal;
import com.portmatch.global.api.BaseApiResponse;
import com.portmatch.global.exception.BusinessException;
import com.portmatch.global.response.ResponseCode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "기업 관리", description = "기업 정보 등록, 조회, 수정, 삭제를 담당하는 API입니다.")
@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CompaniesController {

    private final CompaniesService jobCompaniesService;
    private final CompanyRepository companyRepository;
    private final CompanyProjectAnalysisService companyProjectAnalysisService;

    @Operation(summary = "새로운 기업 등록", description = "기업 정보를 입력받아 데이터베이스에 저장합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "등록 성공"),
            @ApiResponse(responseCode = "2002", description = "기업명 누락 등 파라미터 오류", content = @Content)
    })
    @PostMapping
    public BaseApiResponse<String> createCompany(@RequestBody CompaniesDto dto) {
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
        try {
            jobCompaniesService.deleteCompany(cid);
            return BaseApiResponse.ok("기업 삭제가 완료되었습니다.");
        } catch (Exception e) {
            return BaseApiResponse.error(ResponseCode.NOT_FOUND);
        }
    }

    @Operation(summary = "이름 키워드 검색", description = "기업 이름에 키워드가 포함된 기업을 검색합니다.")
    @GetMapping("/search")
    public BaseApiResponse<List<CompanyNameResponse>> getJobsByTitle(@RequestParam("keyword") String keyword) {
        List<CompanyNameResponse> jobs = jobCompaniesService.getCompanyByName(keyword);
        return BaseApiResponse.ok(jobs);
    }

    @Operation(summary = "기업 프로젝트 조회", description = "기업 프로젝트 목록을 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "2001", description = "존재하지 않는 URL 또는 리소스", content = @Content)
    })
    @GetMapping("/{cid}/projects")
    public BaseApiResponse<CompanyProjectResponse> getCompanyProjects(
            @Parameter(description = "기업 cid", example = "12345") @PathVariable String cid
    ) {
        return BaseApiResponse.ok(companyProjectAnalysisService.getProjectsByCompanyCid(cid));
    }

    @Operation(summary = "기업 프로젝트 전체 교체", description = "기업 프로젝트를 모두 삭제하고 요청 값으로 교체합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "교체 성공"),
            @ApiResponse(responseCode = "2101", description = "역할 불일치", content = @Content),
            @ApiResponse(responseCode = "2004", description = "권한 없음", content = @Content)
    })
    @PutMapping("/{cid}/projects")
    public BaseApiResponse<Integer> replaceCompanyProjects(
            @AuthenticationPrincipal UserPrincipal principal,
            @Parameter(description = "기업 cid", example = "12345") @PathVariable String cid,
            @Valid @RequestBody CompanyProjectReplaceRequest request
    ) {
        if (principal == null) {
            throw new BusinessException(ResponseCode.UNAUTHORIZED);
        }
        if (principal.getUser().getRole() != Role.COMPANY) {
            throw new BusinessException(ResponseCode.ROLE_MISMATCH);
        }

        Company company = companyRepository.findByUserId(principal.getUser().getId())
                .orElseThrow(() -> new BusinessException(ResponseCode.UNAUTHORIZED));

        if (company.getCid() == null || !company.getCid().equals(cid)) {
            throw new BusinessException(ResponseCode.UNAUTHORIZED);
        }

        int embeddedCount = companyProjectAnalysisService.replaceCompanyProjects(company, request);
        return BaseApiResponse.ok(embeddedCount);
    }
}
