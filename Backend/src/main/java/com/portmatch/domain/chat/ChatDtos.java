package com.portmatch.domain.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public final class ChatDtos {
    private ChatDtos() {}

    public record CreateRoomRequest(@NotNull Long targetUserId) {}
    public record ReadRequest(long roomSequence) {}
    public record SendMessageRequest(
            @NotNull UUID clientMessageId,
            @NotBlank @Size(max = 4000) String content,
            MessageType messageType,
            Long interviewId,
            Long jobPostingId,
            @Size(max = 500) String jobPostingTitle,
            @Size(max = 100) String testRunId
    ) {}
    public record RoomResponse(
            UUID id, String roomType, Long companyId, String companyName, Long applicantId, String applicantName,
            String lastMessage, Long lastSenderId, Instant lastUpdatedAt, long unreadCount, long lastReadSequence
    ) {}
    public record MessageResponse(
            UUID id, UUID roomId, long roomSequence, Long senderId, String senderName,
            String content, MessageType messageType, Instant createdAt, Long interviewId,
            Long jobPostingId, String jobPostingTitle, String testRunId
    ) {}
}
