package com.portmatch.domain.chat;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
class ChatRabbitConfig {
    static final String EXCHANGE = "chat.events";
    static final String ROUTING_KEY = "chat.message.created";
    static final String QUEUE = "chat.message.created.q";
    static final String RETRY_EXCHANGE = "chat.events.retry";
    static final String RETRY_QUEUE = "chat.message.created.retry.q";
    static final String DLX = "chat.events.dlx";
    static final String DLQ = "chat.message.created.dlq";
    static final String OBSERVER_QUEUE = "chat.experiment.observer.q";

    @Bean TopicExchange chatExchange() { return ExchangeBuilder.topicExchange(EXCHANGE).durable(true).build(); }
    @Bean DirectExchange chatRetryExchange() { return ExchangeBuilder.directExchange(RETRY_EXCHANGE).durable(true).build(); }
    @Bean DirectExchange chatDeadLetterExchange() { return ExchangeBuilder.directExchange(DLX).durable(true).build(); }

    @Bean Queue chatQueue() { return QueueBuilder.durable(QUEUE).build(); }
    @Bean Queue chatRetryQueue(org.springframework.core.env.Environment environment) {
        int delay = environment.getProperty("chat.retry-delay-ms", Integer.class, 1000);
        return QueueBuilder.durable(RETRY_QUEUE)
                .ttl(delay)
                .deadLetterExchange(EXCHANGE)
                .deadLetterRoutingKey(ROUTING_KEY)
                .build();
    }
    @Bean Queue chatDeadLetterQueue() { return QueueBuilder.durable(DLQ).build(); }
    @Bean Queue chatObserverQueue() { return QueueBuilder.durable(OBSERVER_QUEUE).build(); }

    @Bean Binding chatBinding(Queue chatQueue, TopicExchange chatExchange) {
        return BindingBuilder.bind(chatQueue).to(chatExchange).with(ROUTING_KEY);
    }
    @Bean Binding chatRetryBinding(Queue chatRetryQueue, DirectExchange chatRetryExchange) {
        return BindingBuilder.bind(chatRetryQueue).to(chatRetryExchange).with(ROUTING_KEY);
    }
    @Bean Binding chatDlqBinding(Queue chatDeadLetterQueue, DirectExchange chatDeadLetterExchange) {
        return BindingBuilder.bind(chatDeadLetterQueue).to(chatDeadLetterExchange).with(ROUTING_KEY);
    }
    @Bean Binding chatObserverBinding(Queue chatObserverQueue, TopicExchange chatExchange) {
        return BindingBuilder.bind(chatObserverQueue).to(chatExchange).with(ROUTING_KEY);
    }

    @Bean Jackson2JsonMessageConverter chatJsonConverter(ObjectMapper objectMapper) {
        return new Jackson2JsonMessageConverter(objectMapper);
    }
}
