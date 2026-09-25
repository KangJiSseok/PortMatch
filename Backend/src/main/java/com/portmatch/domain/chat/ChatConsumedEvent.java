package com.portmatch.domain.chat;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "chat_consumed_event")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
class ChatConsumedEvent {
    @Id @Column(name = "event_id") private UUID eventId;
    @Column(name = "message_id", nullable = false) private UUID messageId;
    @Column(name = "test_run_id") private String testRunId;
    @Column(name = "processed_at", nullable = false) private Instant processedAt;

    ChatConsumedEvent(ChatMessageCreatedEvent event) {
        eventId = event.eventId();
        messageId = event.messageId();
        testRunId = event.testRunId();
        processedAt = Instant.now();
    }
}
