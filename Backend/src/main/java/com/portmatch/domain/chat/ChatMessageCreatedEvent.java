package com.portmatch.domain.chat;

import java.time.Instant;
import java.util.UUID;

public record ChatMessageCreatedEvent(
        UUID eventId,
        String eventType,
        UUID messageId,
        UUID roomId,
        long roomSequence,
        Long senderId,
        Long recipientId,
        Instant occurredAt,
        int schemaVersion,
        String testRunId,
        String content,
        String messageType,
        Long interviewId,
        Long jobPostingId,
        String jobPostingTitle
) {
    static ChatMessageCreatedEvent from(ChatMessage message, long recipientId) {
        return new ChatMessageCreatedEvent(UUID.randomUUID(), "CHAT_MESSAGE_CREATED", message.getId(),
                message.getRoomId(), message.getRoomSequence(), message.getSenderId(), recipientId,
                message.getCreatedAt(), 1, message.getTestRunId(), message.getContent(),
                message.getMessageType().name(), message.getInterviewId(), message.getJobPostingId(),
                message.getJobPostingTitle());
    }
}
