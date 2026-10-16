package com.portmatch.domain.chat;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessagePostProcessor;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.core.ReturnedMessage;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;
import java.util.concurrent.TimeoutException;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class ChatRabbitPublisherTest {
    @ParameterizedTest
    @ValueSource(strings = {"ack", "nack", "timeout", "returned"})
    void onlyBrokerAckWithoutReturnCountsAsSuccess(String outcome) {
        RabbitTemplate rabbit = mock(RabbitTemplate.class);
        var publisher = new ChatRabbitPublisher(rabbit);
        ReflectionTestUtils.setField(publisher, "retries", 1);
        var event = ChatMessageCreatedEvent.from(ChatMessage.create(UUID.randomUUID(), 1, 1L,
                UUID.randomUUID(), "hello", MessageType.TEXT, null, null, null, "test"), 2L);
        doAnswer(i -> {
            CorrelationData correlation = i.getArgument(4);
            if (outcome.equals("timeout")) correlation.getFuture().completeExceptionally(new TimeoutException());
            else {
                if (outcome.equals("returned")) correlation.setReturned(new ReturnedMessage(
                        new Message(new byte[0], new MessageProperties()), 312, "NO_ROUTE", "chat.events", "chat.message.created"));
                correlation.getFuture().complete(new CorrelationData.Confirm(!outcome.equals("nack"), "test"));
            }
            return null;
        }).when(rabbit).convertAndSend(anyString(), anyString(), any(Object.class), any(MessagePostProcessor.class), any(CorrelationData.class));
        if (outcome.equals("ack")) assertThatCode(() -> publisher.publish(event)).doesNotThrowAnyException();
        else assertThatThrownBy(() -> publisher.publish(event)).isInstanceOf(IllegalStateException.class);
    }
}
