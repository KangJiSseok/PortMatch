package com.portmatch.domain.webRTC.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(name = "PeerRegisterRequest", description = "PeerJS 방 입장 시 전달하는 등록 요청 DTO")
public class PeerRegisterRequest {

    @Schema(description = "PeerJS가 발급한 ID", example = "peer_xxx123")
    private String peerId;

    @Schema(description = "역할", example = "INTERVIEWER")
    private String role; // "INTERVIEWER" or "APPLICANT"
}
