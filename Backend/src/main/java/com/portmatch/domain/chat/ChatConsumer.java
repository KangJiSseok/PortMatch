package com.portmatch.domain.chat;

import com.rabbitmq.client.Channel;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Component
@RequiredArgsConstructor
class ChatConsumer {
    private final ChatConsumerHandler handler;
    private final RabbitTemplate rabbit;
    private final ChatChaosGate chaosGate;
    private final MeterRegistry metrics;
    private final org.springframework.jdbc.core.JdbcTemplate jdbc;
    @Value("${chat.max-attempts:5}") private int maxAttempts;

    @RabbitListener(queues = ChatRabbitConfig.QUEUE)
    void consume(ChatMessageCreatedEvent event, Message raw, Channel channel) throws Exception {
        long tag = raw.getMessageProperties().getDeliveryTag();
        int attempt = retryCount(raw) + 1;
        jdbc.update("insert into chat_consumer_attempt(event_id,message_id,test_run_id) values (?,?,?)",
                event.eventId(), event.messageId(), event.testRunId());
        metrics.counter("chat.consumer.attempt").increment();
        try {
            if ("__CHAOS_PERMANENT_FAILURE__".equals(event.content()))
                throw new PermanentChatFailure("chaos permanent failure");
            boolean processed = handler.process(event);
            if (!processed) metrics.counter("chat.consumer.duplicate").increment();
            chaosGate.haltAt("consumer-after-process", event.roomSequence(), event.testRunId());
            channel.basicAck(tag, false);
        } catch (Exception error) {
            republish(event, attempt, attempt >= maxAttempts);
            channel.basicAck(tag, false);
        }
    }

    private void republish(ChatMessageCreatedEvent event, int attempt, boolean dead) {
        String exchange = dead ? ChatRabbitConfig.DLX : ChatRabbitConfig.RETRY_EXCHANGE;
        rabbit.convertAndSend(exchange, ChatRabbitConfig.ROUTING_KEY, event, message -> {
            message.getMessageProperties().setDeliveryMode(MessageDeliveryMode.PERSISTENT);
            message.getMessageProperties().setHeader("x-chat-retry-count", attempt);
            return message;
        });
        metrics.counter(dead ? "chat.consumer.dlq" : "chat.consumer.retry").increment();
    }

    private int retryCount(Message message) {
        Object value = message.getMessageProperties().getHeaders().get("x-chat-retry-count");
        return value instanceof Number number ? number.intValue() : 0;
    }

    private static class PermanentChatFailure extends RuntimeException {
        PermanentChatFailure(String message) { super(message); }
    }
}

@Service
@RequiredArgsConstructor
class ChatConsumerHandler {
    private final org.springframework.jdbc.core.JdbcTemplate jdbc;
    private final SimpMessagingTemplate messaging;
    private final MeterRegistry metrics;

    @Transactional
    public boolean process(ChatMessageCreatedEvent event) {
        int inserted = jdbc.update("insert into chat_consumed_event(event_id,message_id,test_run_id) values (?,?,?) on conflict do nothing",
                event.eventId(), event.messageId(), event.testRunId());
        if (inserted == 0) return false;
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCommit() {
                messaging.convertAndSend("/topic/chat.rooms." + event.roomId(), event);
            }
        });
        metrics.counter("chat.consumer.processed.unique").increment();
        return true;
    }
}
