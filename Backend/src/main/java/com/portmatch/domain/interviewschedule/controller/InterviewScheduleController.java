package com.portmatch.domain.interviewschedule.controller;

import com.portmatch.domain.interviewschedule.dto.InterviewScheduleDto;
import com.portmatch.domain.interviewschedule.service.InterviewScheduleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "면접 일정", description = "지원자와 채용 공고 간의 면접 일정 관리 API")
@RestController
@RequestMapping("/api/interviews")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // StackController처럼 추가해두면 프론트랑 통신할 때 편해!
public class InterviewScheduleController {

    private final InterviewScheduleService interviewScheduleService;

    @Operation(summary = "유저별 면접 일정 조회", description = "특정 지원자(User)가 신청한 모든 면접 일정을 상세 정보와 함께 조회합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "404", description = "유저를 찾을 수 없음")
    })
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<InterviewScheduleDto>> getMySchedules(
            @Parameter(description = "지원자 고유 ID", example = "3") @PathVariable Long userId) {
        List<InterviewScheduleDto> schedules = interviewScheduleService.getSchedulesByUser(userId);
        return ResponseEntity.ok(schedules);
    }

    @Operation(summary = "공고별 면접 일정 조회", description = "특정 채용 공고(JobPosting)에 잡혀있는 모든 면접 명단을 조회합니다.")
    @GetMapping("/posting/{postingId}")
    public ResponseEntity<List<InterviewScheduleDto>> getPostingSchedules(
            @Parameter(description = "채용 공고 고유 ID", example = "1") @PathVariable Long postingId) {
        List<InterviewScheduleDto> schedules = interviewScheduleService.getSchedulesByJob(postingId);
        return ResponseEntity.ok(schedules);
    }

    @Operation(summary = "면접 일정 등록", description = "지원자와 공고 ID를 매칭하여 새로운 면접 일정을 생성합니다. (중복 등록 방지 로직 포함)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "등록 성공 (생성된 일정 ID 반환)"),
            @ApiResponse(responseCode = "400", description = "이미 등록된 일정임 (중복 오류)")
    })
    @PostMapping
    public ResponseEntity<Long> createSchedule(@RequestBody InterviewScheduleDto dto) {
        Long savedId = interviewScheduleService.createSchedule(dto);
        return ResponseEntity.ok(savedId);
    }

    @Operation(summary = "면접 일정 삭제", description = "등록된 면접 일정을 시스템에서 완전히 삭제합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "삭제 성공"),
            @ApiResponse(responseCode = "404", description = "존재하지 않는 일정 ID")
    })
    @DeleteMapping("/{scheduleId}")
    public ResponseEntity<Void> deleteSchedule(
            @Parameter(description = "면접 일정 고유 ID", example = "1") @PathVariable Long scheduleId) {
        interviewScheduleService.deleteSchedule(scheduleId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "면접 일정 수정", description = "기존 면접 일정의 시간이나 상태(PENDING, APPROVED 등)를 수정합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "수정 성공"),
            @ApiResponse(responseCode = "404", description = "존재하지 않는 일정 ID")
    })
    @PutMapping("/{scheduleId}")
    public ResponseEntity<Void> updateSchedule(
            @Parameter(description = "수정할 일정 ID", example = "1") @PathVariable Long scheduleId,
            @RequestBody InterviewScheduleDto dto) {

        interviewScheduleService.updateSchedule(scheduleId, dto);
        return ResponseEntity.ok().build();
    }
    @Operation(summary = "기업별 면접 일정 조회", description = "특정 기업(cid)에 등록된 모든 공고의 면접 일정을 가져옵니다.")
    @GetMapping("/company/{cid}")
    public ResponseEntity<List<InterviewScheduleDto>> getSchedulesByCompany(@PathVariable String cid) {
        List<InterviewScheduleDto> response = interviewScheduleService.getSchedulesByCompany(cid);
        return ResponseEntity.ok(response);
    }
}