package com.portmatch.domain.chat;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "chat_message")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
class ChatMessage {
    @Id private UUID id;
    @Column(name = "room_id", nullable = false) private UUID roomId;
    @Column(name = "room_sequence", nullable = false) private long roomSequence;
    @Column(name = "sender_id") private Long senderId;
    @Column(name = "client_message_id", nullable = false) private UUID clientMessageId;
    @Column(nullable = false) private String content;
    @Enumerated(EnumType.STRING) @Column(name = "message_type", nullable = false) private MessageType messageType;
    @Column(name = "interview_id") private Long interviewId;
    @Column(name = "job_posting_id") private Long jobPostingId;
    @Column(name = "job_posting_title") private String jobPostingTitle;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "test_run_id") private String testRunId;

    static ChatMessage create(UUID roomId, long sequence, Long senderId, UUID clientMessageId,
                              String content, MessageType type, Long interviewId, Long jobPostingId,
                              String jobPostingTitle, String testRunId) {
        ChatMessage message = new ChatMessage();
        message.id = UUID.randomUUID();
        message.roomId = roomId;
        message.roomSequence = sequence;
        message.senderId = senderId;
        message.clientMessageId = clientMessageId;
        message.content = content;
        message.messageType = type;
        message.interviewId = interviewId;
        message.jobPostingId = jobPostingId;
        message.jobPostingTitle = jobPostingTitle;
        message.createdAt = Instant.now();
        message.testRunId = testRunId;
        return message;
    }
}

enum MessageType { TEXT, INTERVIEW, SYSTEM }
