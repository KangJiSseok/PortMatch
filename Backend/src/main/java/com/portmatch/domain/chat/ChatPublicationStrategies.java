package com.portmatch.domain.chat;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "chat.publish-mode", havingValue = "direct", matchIfMissing = true)
class DirectChatEventPublicationStrategy implements ChatEventPublicationStrategy {
    private final ChatRabbitPublisher publisher;
    private final ChatChaosGate chaosGate;

    @Override
    public void publish(ChatMessageCreatedEvent event) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCommit() {
                chaosGate.haltAt("direct-after-commit", event.roomSequence(), event.testRunId());
                try {
                    publisher.publish(event);
                } catch (RuntimeException exception) {
                    // The message is committed already. Direct mode deliberately has no recovery store.
                    log.error("direct chat event publish failed after commit: eventId={}", event.eventId(), exception);
                }
            }
        });
    }
}

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "chat.publish-mode", havingValue = "outbox")
class OutboxChatEventPublicationStrategy implements ChatEventPublicationStrategy {
    private final ChatOutboxRepository repository;
    private final ObjectMapper objectMapper;
    private final ChatChaosGate chaosGate;

    @Override
    public void publish(ChatMessageCreatedEvent event) {
        try {
            repository.save(ChatOutbox.pending(event, objectMapper.writeValueAsString(event)));
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCommit() {
                    chaosGate.haltAt("outbox-after-commit", event.roomSequence(), event.testRunId());
                }
            });
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("chat event serialization failed", e);
        }
    }
}
