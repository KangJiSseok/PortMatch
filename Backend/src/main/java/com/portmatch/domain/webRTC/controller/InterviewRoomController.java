package com.portmatch.domain.webRTC.controller;

import com.portmatch.domain.webRTC.dto.PeerRegisterRequest;
import com.portmatch.domain.webRTC.service.InterviewRoomService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/interview-rooms")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "인터뷰룸", description = "PeerJS 면접룸 매칭 API")
public class InterviewRoomController {

    private final InterviewRoomService service;

    @Operation(summary = "내 Peer 등록", description = "roomId에 내 peerId와 role을 등록합니다.")
    @ApiResponse(responseCode = "200", description = "등록 성공")
    @PostMapping("/{roomId}/peer")
    public ResponseEntity<Void> registerPeer(
            @PathVariable String roomId,
            @RequestBody PeerRegisterRequest request
    ) {
        service.registerPeer(roomId, request.getRole(), request.getPeerId());
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "일정 기준 방 생성", description = "scheduleId 기준으로 1일정=1방을 생성합니다.")
    @ApiResponse(
            responseCode = "200",
            description = "생성 성공",
            content = @Content(schema = @Schema(implementation = Map.class))
    )
    @PostMapping("/{scheduleId}")
    public ResponseEntity<Map<String, String>> createRoom(@PathVariable Long scheduleId) {
        String roomId = service.createRoom(scheduleId);
        return ResponseEntity.ok(Map.of("roomId", roomId));
    }

    @Operation(summary = "상대 Peer 조회", description = "상대방의 peerId를 조회합니다. 없으면 null.")
    @ApiResponse(
            responseCode = "200",
            description = "조회 성공",
            content = @Content(schema = @Schema(implementation = Map.class))
    )
    @GetMapping("/{roomId}/partner")
    public ResponseEntity<Map<String, String>> getPartner(
            @PathVariable String roomId,
            @RequestParam String role
    ) {
        String partnerId = service.getPartnerPeerId(roomId, role);

        Map<String, String> response = new HashMap<>();
        response.put("partnerId", partnerId); // null이면 JSON도 null
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "방 상태 조회", description = "WAITING/OPEN/CLOSED 상태를 조회합니다.")
    @ApiResponse(
            responseCode = "200",
            description = "조회 성공",
            content = @Content(schema = @Schema(implementation = Map.class))
    )
    @GetMapping("/{roomId}/status")
    public ResponseEntity<Map<String, String>> getStatus(@PathVariable String roomId) {
        String status = service.getRoomStatus(roomId);
        return ResponseEntity.ok(Map.of("status", status));
    }

    @Operation(summary = "방 종료", description = "roomId 방을 종료/삭제합니다.")
    @ApiResponse(responseCode = "200", description = "삭제 성공")
    @DeleteMapping("/{roomId}")
    public ResponseEntity<Void> closeRoom(@PathVariable String roomId) {
        service.closeRoom(roomId);
        return ResponseEntity.ok().build();
    }
}
