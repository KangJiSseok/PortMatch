package com.portmatch.domain.chat;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "chat_outbox")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
class ChatOutbox {
    @Id @Column(name = "event_id") private UUID eventId;
    @Column(name = "message_id", nullable = false) private UUID messageId;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb") private String payload;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private OutboxStatus status;
    @Column(nullable = false) private int attempts;
    @Column(name = "next_attempt_at", nullable = false) private Instant nextAttemptAt;
    @Column(name = "lease_until") private Instant leaseUntil;
    @Column(name = "last_error") private String lastError;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "published_at") private Instant publishedAt;

    static ChatOutbox pending(ChatMessageCreatedEvent event, String payload) {
        ChatOutbox outbox = new ChatOutbox();
        outbox.eventId = event.eventId();
        outbox.messageId = event.messageId();
        outbox.payload = payload;
        outbox.status = OutboxStatus.PENDING;
        outbox.nextAttemptAt = Instant.now();
        outbox.createdAt = Instant.now();
        return outbox;
    }
}

enum OutboxStatus { PENDING, PROCESSING, PUBLISHED, FAILED }
