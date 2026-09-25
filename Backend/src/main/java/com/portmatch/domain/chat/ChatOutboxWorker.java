package com.portmatch.domain.chat;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "chat.publish-mode", havingValue = "outbox")
class ChatOutboxWorker {
    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;
    private final ChatRabbitPublisher publisher;
    private final ChatChaosGate chaosGate;
    @Value("${chat.outbox.batch-size:100}") private int batchSize;
    @Value("${chat.outbox.lease-seconds:30}") private int leaseSeconds;
    @Value("${chat.max-attempts:5}") private int maxAttempts;
    @Value("${chat.retry-delay-ms:1000}") private long retryDelayMs;
    @Value("${chat.outbox.retention-days:7}") private int retentionDays;

    @Scheduled(fixedDelayString = "${chat.outbox.poll-delay-ms:250}")
    void publishPending() {
        for (Claim claim : claim()) {
            try {
                ChatMessageCreatedEvent event = objectMapper.readValue(claim.payload(), ChatMessageCreatedEvent.class);
                publisher.publish(event);
                chaosGate.haltAt("outbox-after-confirm", event.roomSequence(), event.testRunId());
                jdbc.update("update chat_outbox set status='PUBLISHED',published_at=now(),lease_until=null,last_error=null where event_id=? and status='PROCESSING'",
                        claim.eventId());
            } catch (Exception e) {
                fail(claim, e);
            }
        }
    }

    private List<Claim> claim() {
        String sql = """
                with picked as (
                  select event_id from chat_outbox
                  where (status='PENDING' and next_attempt_at<=now())
                     or (status='PROCESSING' and lease_until<now())
                  order by created_at for update skip locked limit ?
                )
                update chat_outbox o set status='PROCESSING',attempts=o.attempts+1,
                  lease_until=now()+(? * interval '1 second')
                from picked where o.event_id=picked.event_id
                returning o.event_id,o.payload::text,o.attempts
                """;
        return jdbc.query(sql, (ResultSet rs, int row) ->
                new Claim(rs.getObject("event_id", UUID.class), rs.getString("payload"), rs.getInt("attempts")),
                batchSize, leaseSeconds);
    }

    private void fail(Claim claim, Exception error) {
        boolean exhausted = claim.attempts() >= maxAttempts;
        Instant next = Instant.now().plusMillis(retryDelayMs * Math.max(1, claim.attempts()));
        jdbc.update("update chat_outbox set status=?,next_attempt_at=?,lease_until=null,last_error=? where event_id=?",
                exhausted ? "FAILED" : "PENDING", Timestamp.from(next), abbreviate(error.toString()), claim.eventId());
    }

    @Scheduled(fixedDelay = 3_600_000)
    void cleanPublished() {
        jdbc.update("delete from chat_outbox where status='PUBLISHED' and published_at<?",
                Timestamp.from(Instant.now().minus(Duration.ofDays(retentionDays))));
    }

    private String abbreviate(String value) { return value.substring(0, Math.min(value.length(), 2000)); }
    private record Claim(UUID eventId, String payload, int attempts) {}
}
