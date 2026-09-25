package com.portmatch.domain.chat;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.time.Duration;

interface ChatChaosGate {
    void haltAt(String point, long sequence, String testRunId);
}

@Component
@Profile("!chaos")
class DisabledChatChaosGate implements ChatChaosGate {
    public void haltAt(String point, long sequence, String testRunId) {}
}

@Component
@Profile("chaos")
class EnabledChatChaosGate implements ChatChaosGate {
    private final String point;
    private final long triggerSequence;
    private final StringRedisTemplate redis;

    EnabledChatChaosGate(@Value("${chat.chaos.point:none}") String point,
                         @Value("${chat.chaos.trigger-sequence:-1}") long triggerSequence,
                         StringRedisTemplate redis) {
        this.point = point;
        this.triggerSequence = triggerSequence;
        this.redis = redis;
    }

    public void haltAt(String candidate, long sequence, String testRunId) {
        if (point.equals(candidate) && sequence == triggerSequence && testRunId != null
                && Boolean.TRUE.equals(redis.opsForValue().setIfAbsent(
                "chat:chaos:" + candidate + ":" + testRunId, "1", Duration.ofHours(6))))
            Runtime.getRuntime().halt(137);
    }
}
