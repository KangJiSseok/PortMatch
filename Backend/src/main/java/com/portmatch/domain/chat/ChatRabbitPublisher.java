package com.portmatch.domain.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
class ChatRabbitPublisher {
    private final RabbitTemplate rabbit;
    @Value("${chat.immediate-retries:3}") private int retries;
    @Value("${chat.retry-delay-ms:1000}") private long retryDelayMs;

    void publish(ChatMessageCreatedEvent event) {
        RuntimeException last = null;
        for (int attempt = 1; attempt <= retries; attempt++) {
            try {
                CorrelationData correlation = new CorrelationData(event.eventId().toString());
                rabbit.convertAndSend(ChatRabbitConfig.EXCHANGE, ChatRabbitConfig.ROUTING_KEY, event, message -> {
                    message.getMessageProperties().setDeliveryMode(MessageDeliveryMode.PERSISTENT);
                    message.getMessageProperties().setHeader("eventId", event.eventId().toString());
                    return message;
                }, correlation);
                CorrelationData.Confirm confirm = correlation.getFuture().get(10, TimeUnit.SECONDS);
                if (!confirm.isAck()) throw new IllegalStateException("publish nack: " + confirm.getReason());
                if (correlation.getReturned() != null) throw new IllegalStateException("unroutable chat event");
                return;
            } catch (Exception e) {
                last = new IllegalStateException("chat publish failed, attempt=" + attempt, e);
                if (attempt < retries) {
                    try { Thread.sleep(retryDelayMs); }
                    catch (InterruptedException interrupted) {
                        Thread.currentThread().interrupt();
                        throw last;
                    }
                }
            }
        }
        throw last;
    }
}
