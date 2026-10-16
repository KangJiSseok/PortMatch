package com.portmatch.domain.chat;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Component
@Slf4j
@ConditionalOnProperty(name = "chat.publish-mode", havingValue = "outbox")
class ChatOutboxWorker {
    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;
    private final ChatRabbitPublisher publisher;
    private final ChatChaosGate chaosGate;
    private final TransactionTemplate transaction;
    @Value("${chat.outbox.batch-size:100}") private int batchSize;
    @Value("${chat.outbox.lease-seconds:60}") private int leaseSeconds;
    @Value("${chat.max-attempts:5}") private int maxAttempts;
    @Value("${chat.retry-delay-ms:1000}") private long retryDelayMs;
    @Value("${chat.outbox.retention-days:7}") private int retentionDays;

    ChatOutboxWorker(JdbcTemplate jdbc, ObjectMapper objectMapper, ChatRabbitPublisher publisher,
                     ChatChaosGate chaosGate, PlatformTransactionManager transactionManager) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
        this.publisher = publisher;
        this.chaosGate = chaosGate;
        this.transaction = new TransactionTemplate(transactionManager);
        this.transaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    @Scheduled(fixedDelayString = "${chat.outbox.poll-delay-ms:250}")
    void publishPending() {
        List<UUID> candidates = jdbc.query("""
                select event_id from chat_outbox
                where (status='PENDING' and next_attempt_at<=now())
                   or (status='PROCESSING' and lease_until<now())
                order by created_at limit ?
                """, (rs, row) -> rs.getObject("event_id", UUID.class), batchSize);
        for (UUID eventId : candidates) publishOne(eventId);
    }

    void publishOne(UUID eventId) {
        try {
            Claim claim = transaction.execute(status -> claim(eventId));
            if (claim == null) return;
            ChatMessageCreatedEvent event;
            try {
                event = objectMapper.readValue(claim.payload(), ChatMessageCreatedEvent.class);
                publisher.publish(event);
            } catch (Exception error) {
                transaction.executeWithoutResult(status -> fail(claim, error));
                return;
            }
            chaosGate.haltAt("outbox-after-confirm", event.roomSequence(), event.testRunId());
            // A failed completion write must not turn a confirmed publish into a failed attempt.
            transaction.executeWithoutResult(status -> recordUpdate(claim, jdbc.update("""
                    update chat_outbox set status='PUBLISHED',published_at=now(),lease_until=null,last_error=null
                    where event_id=? and status='PROCESSING' and attempts=?
                    """, claim.eventId(), claim.attempts())));
        } catch (Exception error) {
            log.error("chat outbox processing failed; scheduler will recover: eventId={}", eventId, error);
        }
    }

    private Claim claim(UUID eventId) {
        List<Claim> picked = jdbc.query("""
                select event_id,payload::text,attempts from chat_outbox
                where event_id=? and ((status='PENDING' and next_attempt_at<=now())
                  or (status='PROCESSING' and lease_until<now()))
                for update skip locked
                """, (rs, row) -> new Claim(rs.getObject("event_id", UUID.class),
                rs.getString("payload"), rs.getInt("attempts")), eventId);
        if (picked.isEmpty()) return null;
        Claim previous = picked.getFirst();
        if (previous.attempts() >= maxAttempts) {
            jdbc.update("""
                    update chat_outbox set status='FAILED',lease_until=null,last_error='publish attempts exhausted'
                    where event_id=?
                    """, eventId);
            return null;
        }
        jdbc.update("""
                update chat_outbox set status='PROCESSING',attempts=attempts+1,
                lease_until=now()+(? * interval '1 second') where event_id=?
                """, leaseSeconds, eventId);
        return new Claim(eventId, previous.payload(), previous.attempts() + 1);
    }

    private void fail(Claim claim, Exception error) {
        boolean exhausted = claim.attempts() >= maxAttempts;
        recordUpdate(claim, jdbc.update("""
                update chat_outbox set status=?,next_attempt_at=now()+(? * interval '1 millisecond'),
                lease_until=null,last_error=? where event_id=? and status='PROCESSING' and attempts=?
                """, exhausted ? "FAILED" : "PENDING", retryDelayMs * Math.max(1, claim.attempts()),
                abbreviate(error.toString()), claim.eventId(), claim.attempts()));
    }

    private void recordUpdate(Claim claim, int updated) {
        if (updated == 0) log.info("chat outbox claim ownership lost: eventId={}, attempts={}",
                claim.eventId(), claim.attempts());
    }

    @Scheduled(fixedDelay = 3_600_000)
    void cleanPublished() {
        transaction.executeWithoutResult(status -> jdbc.update(
                "delete from chat_outbox where status='PUBLISHED' and published_at<?",
                Timestamp.from(Instant.now().minus(Duration.ofDays(retentionDays)))));
    }

    private String abbreviate(String value) { return value.substring(0, Math.min(value.length(), 2000)); }
    private record Claim(UUID eventId, String payload, int attempts) {}
}
