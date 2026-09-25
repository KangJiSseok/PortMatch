package com.portmatch.domain.chat;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.core.env.MapPropertySource;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class ChatPublicationTest {
    @Test
    void selectsDirectStrategy() {
        try (var context = context("direct")) {
            assertThat(context.getBeansOfType(ChatEventPublicationStrategy.class).values())
                    .singleElement().isInstanceOf(DirectChatEventPublicationStrategy.class);
        }
    }

    @Test
    void selectsOutboxStrategy() {
        try (var context = context("outbox")) {
            assertThat(context.getBeansOfType(ChatEventPublicationStrategy.class).values())
                    .singleElement().isInstanceOf(OutboxChatEventPublicationStrategy.class);
        }
    }

    @Test
    void directPublishesOnlyAfterCommit() {
        ChatRabbitPublisher publisher = mock(ChatRabbitPublisher.class);
        var strategy = new DirectChatEventPublicationStrategy(publisher, (point, sequence, testRunId) -> {});
        ChatMessage message = ChatMessage.create(java.util.UUID.randomUUID(), 1, 1L,
                java.util.UUID.randomUUID(), "hello", MessageType.TEXT, null, null, null, "run");
        ChatMessageCreatedEvent event = ChatMessageCreatedEvent.from(message, 2L);

        TransactionSynchronizationManager.initSynchronization();
        try {
            strategy.publish(event);
            verifyNoInteractions(publisher);
            TransactionSynchronizationManager.getSynchronizations().forEach(s -> s.afterCommit());
            verify(publisher).publish(event);
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void roomAuthorizesOnlyItsMembers() {
        ChatRoom room = ChatRoom.create(10, 20);
        assertThat(room.contains(10)).isTrue();
        assertThat(room.contains(20)).isTrue();
        assertThat(room.contains(30)).isFalse();
        assertThat(room.recipientOf(10)).isEqualTo(20);
    }

    private AnnotationConfigApplicationContext context(String mode) {
        var context = new AnnotationConfigApplicationContext();
        context.getEnvironment().getPropertySources().addFirst(new MapPropertySource("test", Map.of("chat.publish-mode", mode)));
        context.registerBean(ChatRabbitPublisher.class, () -> mock(ChatRabbitPublisher.class));
        context.registerBean(ChatChaosGate.class, () -> (point, sequence, testRunId) -> {});
        context.registerBean(ChatOutboxRepository.class, () -> mock(ChatOutboxRepository.class));
        context.registerBean(ObjectMapper.class, () -> new ObjectMapper());
        context.register(DirectChatEventPublicationStrategy.class, OutboxChatEventPublicationStrategy.class);
        context.refresh();
        return context;
    }
}
