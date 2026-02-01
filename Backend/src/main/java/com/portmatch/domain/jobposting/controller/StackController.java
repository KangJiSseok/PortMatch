package com.portmatch.domain.jobposting.controller;

import com.portmatch.domain.jobposting.dto.TechStackDto;
import com.portmatch.domain.jobposting.service.StackService;
import com.portmatch.global.api.BaseApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "기술 스택", description = "기술 스택 조회 및 관리 API")
@RestController
@RequestMapping("/api/stacks")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StackController {

    private final StackService stackService;

    @Operation(summary = "전체 기술 스택 목록 조회", description = "데이터베이스에 등록된 모든 기술 스택(Java, Spring 등)을 조회합니다.")
    @GetMapping
    public BaseApiResponse<List<TechStackDto>> getAllStacks() {
        List<TechStackDto> stacks = stackService.getAllTechStacks();
        return BaseApiResponse.ok(stacks);
    }

    @Operation(summary = "공고별 스택 리스트 조회", description = "특정 채용 공고에 요구사항으로 등록된 기술 스택들을 조회합니다.")
    @GetMapping("/posting/{postingId}")
    public BaseApiResponse<List<TechStackDto>> getStacksByPosting(
            @Parameter(description = "공고 ID", example = "job_001") @PathVariable Long postingId) {
        List<TechStackDto> stacks = stackService.getPostingStacks(postingId);
        return BaseApiResponse.ok(stacks);
    }

    @Operation(summary = "마스터 기술 스택 등록", description = "새로운 기술 스택 이름을 시스템에 등록합니다.")
    @ApiResponse(responseCode = "200", description = "등록 성공")
    @PostMapping
    public BaseApiResponse<String> createStack(@RequestBody TechStackDto techStackDto) {
        stackService.createStack(techStackDto.getStackId(), techStackDto.getStackName());
        return BaseApiResponse.ok("기술 스택이 성공적으로 등록되었습니다.");
    }

    @Operation(summary = "스택 상세 조회", description = "스택 고유 ID(Long)를 통해 특정 스택 정보를 조회합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "2001", description = "존재하지 않는 스택 ID")
    })
    @GetMapping("/{id}")
    public BaseApiResponse<TechStackDto> getStackById(
            @Parameter(description = "스택 고유 ID", example = "1") @PathVariable Long id) {
        TechStackDto stack = stackService.getTechStackById(id);
        return BaseApiResponse.ok(stack);
    }
}
