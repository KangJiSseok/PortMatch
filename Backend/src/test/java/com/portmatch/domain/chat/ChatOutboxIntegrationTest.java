package com.portmatch.domain.chat;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@DataJpaTest(showSql = false, properties = {"spring.flyway.enabled=false", "spring.sql.init.mode=never",
        "spring.jpa.hibernate.ddl-auto=none"})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ContextConfiguration(classes = ChatOutboxIntegrationTest.Config.class)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Testcontainers
class ChatOutboxIntegrationTest {
    @TestConfiguration
    @EntityScan(basePackageClasses = ChatOutbox.class)
    @EnableJpaRepositories(basePackageClasses = ChatOutboxRepository.class)
    static class Config {}

    @Container
    static final PostgreSQLContainer<?> DB = new PostgreSQLContainer<>("postgres:17-alpine")
            .withInitScript("db/migration/V2026092301__chat.sql");

    @Container
    static final org.testcontainers.containers.RabbitMQContainer MQ =
            new org.testcontainers.containers.RabbitMQContainer("rabbitmq:4.1-management");

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", DB::getJdbcUrl);
        r.add("spring.datasource.username", DB::getUsername);
        r.add("spring.datasource.password", DB::getPassword);
    }

    @Autowired JdbcTemplate jdbc;
    @Autowired ChatOutboxRepository repository;
    @Autowired PlatformTransactionManager manager;
    final ObjectMapper mapper = new ObjectMapper().findAndRegisterModules();
    ChatRabbitPublisher publisher;
    ChatOutboxWorker worker;
    TransactionTemplate transaction;
    ChatMessageCreatedEvent event;
    SimpleMeterRegistry metrics;

    @BeforeEach
    void setup() {
        jdbc.update("truncate chat_outbox,chat_message,chat_room cascade");
        publisher = mock(ChatRabbitPublisher.class);
        worker = worker(jdbc);
        transaction = new TransactionTemplate(manager);
        metrics = new SimpleMeterRegistry();
        event = ChatMessageCreatedEvent.from(ChatMessage.create(UUID.randomUUID(), 1, 1L,
                UUID.randomUUID(), "hello", MessageType.TEXT, null, null, null, "outbox-test"), 2L);
    }

    ChatOutboxWorker worker(JdbcTemplate db) {
        var w = new ChatOutboxWorker(db, mapper, publisher, (p, s, r) -> {}, manager);
        ReflectionTestUtils.setField(w, "batchSize", 100);
        ReflectionTestUtils.setField(w, "leaseSeconds", 60);
        ReflectionTestUtils.setField(w, "maxAttempts", 3);
        ReflectionTestUtils.setField(w, "retryDelayMs", 60_000L);
        return w;
    }

    void save(Executor executor) {
        jdbc.update("insert into chat_room(id,company_user_id,applicant_user_id) values (?,1,2) on conflict (id) do nothing", event.roomId());
        jdbc.update("""
                insert into chat_message(id,room_id,room_sequence,sender_id,client_message_id,content,message_type,created_at)
                values (?,?,?,1,?,'hello','TEXT',now())
                """, event.messageId(), event.roomId(), event.roomSequence(), UUID.randomUUID());
        new OutboxChatEventPublicationStrategy(repository, mapper, (p, s, r) -> {}, worker, executor, metrics).publish(event);
    }

    void pending() { transaction.executeWithoutResult(s -> save(task -> {})); }
    String status() { return jdbc.queryForObject("select status from chat_outbox where event_id=?", String.class, event.eventId()); }
    int attempts() { return jdbc.queryForObject("select attempts from chat_outbox where event_id=?", Integer.class, event.eventId()); }
    void expire() { jdbc.update("update chat_outbox set lease_until=now()-interval '1 second' where event_id=?", event.eventId()); }

    @Test
    void realCommitDispatchesWithoutSchedulerAndDoesNotWaitForMq() throws Exception {
        var entered = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        try (var executor = new ChatOutboxExecutorConfig().chatOutboxExecutor(2, 100, 1)) {
            doAnswer(i -> {
                assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
                assertThat(status()).isEqualTo("PROCESSING");
                transaction.executeWithoutResult(s -> jdbc.queryForList(
                        "select event_id from chat_outbox where event_id=? for update nowait", event.eventId()));
                entered.countDown();
                assertThat(release.await(5, TimeUnit.SECONDS)).isTrue();
                return null;
            }).when(publisher).publish(any());
            try {
                transaction.executeWithoutResult(s -> {
                    save(executor);
                    verifyNoInteractions(publisher);
                    assertThat(executor.getTaskCount()).isZero();
                });
                assertThat(entered.await(5, TimeUnit.SECONDS)).isTrue();
                assertThat(status()).isEqualTo("PROCESSING");
            } finally { release.countDown(); }
            executor.shutdown();
            assertThat(executor.awaitTermination(5, TimeUnit.SECONDS)).isTrue();
            assertThat(status()).isEqualTo("PUBLISHED");
            assertThat(attempts()).isEqualTo(1);
        }
    }

    @Test
    void rollbackRemovesMessageAndOutboxAndNeverDispatches() {
        Executor executor = mock(Executor.class);
        transaction.executeWithoutResult(s -> { save(executor); s.setRollbackOnly(); });
        assertThat(jdbc.queryForObject("select count(*) from chat_message", Integer.class)).isZero();
        assertThat(jdbc.queryForObject("select count(*) from chat_outbox", Integer.class)).isZero();
        verifyNoInteractions(executor, publisher);
    }

    @Test
    void competingWorkersAndSchedulerOnlyPublishOneValidLease() throws Exception {
        pending();
        var entered = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        doAnswer(i -> { entered.countDown(); assertThat(release.await(5, TimeUnit.SECONDS)).isTrue(); return null; })
                .when(publisher).publish(any());
        try (var executor = Executors.newFixedThreadPool(3)) {
            Future<?> immediate = executor.submit(() -> worker.publishOne(event.eventId()));
            try {
                assertThat(entered.await(5, TimeUnit.SECONDS)).isTrue();
                executor.submit(() -> worker(jdbc).publishOne(event.eventId())).get(5, TimeUnit.SECONDS);
                executor.submit(() -> worker(jdbc).publishPending()).get(5, TimeUnit.SECONDS);
                assertThat(attempts()).isEqualTo(1);
                verify(publisher, times(1)).publish(event);
            } finally { release.countDown(); }
            immediate.get(5, TimeUnit.SECONDS);
        }
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void staleSuccessOrFailureCannotOverwriteNewClaim(boolean lateFailure) throws Exception {
        pending();
        var entered = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        var secondEntered = new CountDownLatch(1);
        var secondRelease = new CountDownLatch(1);
        var calls = new AtomicInteger();
        doAnswer(i -> {
            if (calls.incrementAndGet() == 1) {
                entered.countDown();
                assertThat(release.await(5, TimeUnit.SECONDS)).isTrue();
                if (lateFailure) throw new IllegalStateException("late failure");
            } else {
                secondEntered.countDown();
                assertThat(secondRelease.await(5, TimeUnit.SECONDS)).isTrue();
            }
            return null;
        }).when(publisher).publish(any());
        try (var executor = Executors.newFixedThreadPool(2)) {
            Future<?> old = executor.submit(() -> worker.publishOne(event.eventId()));
            Future<?> current = null;
            try {
                assertThat(entered.await(5, TimeUnit.SECONDS)).isTrue();
                expire();
                current = executor.submit(() -> worker(jdbc).publishOne(event.eventId()));
                assertThat(secondEntered.await(5, TimeUnit.SECONDS)).isTrue();
                release.countDown();
                old.get(5, TimeUnit.SECONDS);
                assertThat(status()).isEqualTo("PROCESSING");
                assertThat(attempts()).isEqualTo(2);
                assertThat(jdbc.queryForObject("select last_error from chat_outbox", String.class)).isNull();
            } finally {
                release.countDown();
                secondRelease.countDown();
            }
            if (current != null) current.get(5, TimeUnit.SECONDS);
            assertThat(status()).isEqualTo("PUBLISHED");
        }
    }

    @Test
    void failedPublishWaitsUntilDueThenRecovers() {
        pending();
        doThrow(new IllegalStateException("MQ unavailable")).doNothing().when(publisher).publish(any());
        worker.publishOne(event.eventId());
        assertThat(status()).isEqualTo("PENDING");
        worker.publishPending();
        worker.publishOne(event.eventId());
        assertThat(attempts()).isEqualTo(1);
        jdbc.update("update chat_outbox set next_attempt_at=now()-interval '1 second'");
        worker.publishPending();
        assertThat(status()).isEqualTo("PUBLISHED");
        assertThat(attempts()).isEqualTo(2);
    }

    @Test
    void expiredFinalAttemptBecomesFailedButLiveFinalAttemptIsUntouched() {
        pending();
        jdbc.update("update chat_outbox set status='PROCESSING',attempts=3,lease_until=now()+interval '1 minute'");
        worker.publishOne(event.eventId());
        assertThat(status()).isEqualTo("PROCESSING");
        expire();
        worker.publishPending();
        assertThat(status()).isEqualTo("FAILED");
        worker.publishOne(event.eventId());
        assertThat(attempts()).isEqualTo(3);
        verifyNoInteractions(publisher);
    }

    @Test
    void lastPublishFailureBecomesFailed() {
        pending();
        jdbc.update("update chat_outbox set attempts=2");
        doThrow(new IllegalStateException("failed")).when(publisher).publish(any());
        worker.publishOne(event.eventId());
        assertThat(status()).isEqualTo("FAILED");
        assertThat(attempts()).isEqualTo(3);
    }

    @Test
    void saturationRejectsWithoutRunningOnCallerAndSchedulerRecovers() throws Exception {
        var release = new CountDownLatch(1);
        var entered = new CountDownLatch(1);
        try (var executor = new ChatOutboxExecutorConfig().chatOutboxExecutor(1, 1, 1)) {
            executor.execute(() -> {
                entered.countDown();
                try { release.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            });
            try {
                assertThat(entered.await(5, TimeUnit.SECONDS)).isTrue();
                executor.execute(() -> {});
                transaction.executeWithoutResult(s -> save(executor));
                assertThat(status()).isEqualTo("PENDING");
                assertThat(attempts()).isZero();
                verifyNoInteractions(publisher);
                assertThat(executor.getPoolSize()).isEqualTo(1);
                assertThat(executor.getQueue()).hasSize(1);
                assertThat(metrics.counter("chat.outbox.dispatch.rejected").count()).isEqualTo(1);
                worker.publishPending();
                assertThat(status()).isEqualTo("PUBLISHED");
            } finally { release.countDown(); }
        }
    }

    @Test
    void confirmedPublishWithCompletionDbFailureRemainsRecoverable() {
        pending();
        var failingJdbc = spy(jdbc);
        doThrow(new org.springframework.dao.DataAccessResourceFailureException("completion unavailable"))
                .when(failingJdbc).update(contains("status='PUBLISHED'"), any(Object[].class));
        worker(failingJdbc).publishOne(event.eventId());
        assertThat(status()).isEqualTo("PROCESSING");
        assertThat(attempts()).isEqualTo(1);
        expire();
        worker.publishPending();
        assertThat(status()).isEqualTo("PUBLISHED");
    }
    @Test
    void lockedRowIsSkippedAndRecoveredLater() throws Exception {
        pending();
        try (var executor = Executors.newSingleThreadExecutor()) {
            transaction.executeWithoutResult(s -> {
                jdbc.queryForList("select event_id from chat_outbox for update");
                try { executor.submit(() -> worker.publishOne(event.eventId())).get(5, TimeUnit.SECONDS); }
                catch (Exception e) { throw new AssertionError(e); }
                assertThat(status()).isEqualTo("PENDING");
                verifyNoInteractions(publisher);
            });
        }
        worker.publishPending();
        assertThat(status()).isEqualTo("PUBLISHED");
    }

    @Test
    void consumerDeduplicatesConcurrentAndSequentialDeliveries() throws Exception {
        jdbc.update("truncate chat_consumed_event");
        var messaging = mock(org.springframework.messaging.simp.SimpMessagingTemplate.class);
        var handler = new ChatConsumerHandler(jdbc, messaging, metrics);
        var start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            Callable<Boolean> consume = () -> {
                start.await();
                return transaction.execute(s -> handler.process(event));
            };
            var first = executor.submit(consume);
            var second = executor.submit(consume);
            start.countDown();
            assertThat(java.util.List.of(first.get(5, TimeUnit.SECONDS), second.get(5, TimeUnit.SECONDS)))
                    .containsExactlyInAnyOrder(true, false);
        }
        Boolean repeated = transaction.execute(s -> handler.process(event));
        assertThat(repeated).isFalse();
        assertThat(jdbc.queryForObject("select count(*) from chat_consumed_event", Integer.class)).isEqualTo(1);
        verify(messaging, times(1)).convertAndSend("/topic/chat.rooms." + event.roomId(), event);
    }

    org.springframework.amqp.rabbit.connection.CachingConnectionFactory connectionFactory() {
        var connection = new org.springframework.amqp.rabbit.connection.CachingConnectionFactory(MQ.getHost(), MQ.getAmqpPort());
        connection.setUsername(MQ.getAdminUsername());
        connection.setPassword(MQ.getAdminPassword());
        connection.setPublisherConfirmType(org.springframework.amqp.rabbit.connection.CachingConnectionFactory.ConfirmType.CORRELATED);
        connection.setPublisherReturns(true);
        return connection;
    }

    ChatRabbitPublisher realPublisher(org.springframework.amqp.rabbit.connection.CachingConnectionFactory connection) {
        var rabbit = new org.springframework.amqp.rabbit.core.RabbitTemplate(connection);
        rabbit.setMandatory(true);
        rabbit.setMessageConverter(new org.springframework.amqp.support.converter.Jackson2JsonMessageConverter(mapper));
        var result = new ChatRabbitPublisher(rabbit);
        ReflectionTestUtils.setField(result, "retries", 1);
        return result;
    }

    org.springframework.amqp.rabbit.core.RabbitAdmin declareBroker(
            org.springframework.amqp.rabbit.connection.CachingConnectionFactory connection) {
        var admin = new org.springframework.amqp.rabbit.core.RabbitAdmin(connection);
        var exchange = new org.springframework.amqp.core.TopicExchange(ChatRabbitConfig.EXCHANGE);
        var queue = new org.springframework.amqp.core.Queue(ChatRabbitConfig.QUEUE);
        admin.declareExchange(exchange);
        admin.declareQueue(queue);
        admin.declareBinding(org.springframework.amqp.core.BindingBuilder.bind(queue).to(exchange).with(ChatRabbitConfig.ROUTING_KEY));
        admin.purgeQueue(ChatRabbitConfig.QUEUE);
        return admin;
    }

    @Test
    void realRabbitConfirmAndUnroutableFailureRecoverThroughScheduler() {
        var connection = connectionFactory();
        try {
            var admin = declareBroker(connection);
            publisher = realPublisher(connection);
            worker = worker(jdbc);
            pending();
            admin.deleteQueue(ChatRabbitConfig.QUEUE);
            worker.publishOne(event.eventId());
            assertThat(status()).isEqualTo("PENDING");
            assertThat(attempts()).isEqualTo(1);
            declareBroker(connection);
            jdbc.update("update chat_outbox set next_attempt_at=now()-interval '1 second'");
            worker.publishPending();
            assertThat(status()).isEqualTo("PUBLISHED");
            assertThat(new org.springframework.amqp.rabbit.core.RabbitTemplate(connection)
                    .receive(ChatRabbitConfig.QUEUE, 5000)).isNotNull();
        } finally { connection.destroy(); }
    }

    @Test
    @org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable(named = "RUN_CHAT_OUTBOX_BENCHMARK", matches = "true")
    void compareImmediateAndPollingDispatchWithRealBroker() throws Exception {
        var results = new java.util.LinkedHashMap<String, Object>();
        var connection = connectionFactory();
        try {
            declareBroker(connection);
            var real = realPublisher(connection);
            for (boolean immediate : new boolean[] {false, true}) {
                jdbc.update("truncate chat_outbox,chat_message,chat_room cascade");
                var roomId = UUID.randomUUID();
                var starts = new ConcurrentHashMap<UUID, Long>();
                var startTimes = new java.util.concurrent.CopyOnWriteArrayList<Double>();
                var confirms = new java.util.concurrent.CopyOnWriteArrayList<Double>();
                var requestTimes = new java.util.ArrayList<Double>();
                var completed = new CountDownLatch(60);
                publisher = mock(ChatRabbitPublisher.class);
                doAnswer(i -> {
                    ChatMessageCreatedEvent e = i.getArgument(0);
                    long commitObserved = starts.get(e.eventId());
                    startTimes.add((System.nanoTime() - commitObserved) / 1_000_000.0);
                    real.publish(e);
                    confirms.add((System.nanoTime() - commitObserved) / 1_000_000.0);
                    completed.countDown();
                    return null;
                }).when(publisher).publish(any());
                worker = worker(jdbc);
                try (var executor = new ChatOutboxExecutorConfig().chatOutboxExecutor(2, 100, 5);
                     var scheduler = Executors.newSingleThreadScheduledExecutor()) {
                    scheduler.scheduleWithFixedDelay(worker::publishPending, 250, 250, TimeUnit.MILLISECONDS);
                    for (int n = 0; n < 60; n++) {
                        event = ChatMessageCreatedEvent.from(ChatMessage.create(roomId, n + 1, 1L,
                                UUID.randomUUID(), "benchmark", MessageType.TEXT, null, null, null, "outbox-benchmark"), 2L);
                        var id = event.eventId();
                        long before = System.nanoTime();
                        transaction.executeWithoutResult(s -> {
                            TransactionSynchronizationManager.registerSynchronization(
                                    new org.springframework.transaction.support.TransactionSynchronization() {
                                        @Override public void afterCommit() { starts.put(id, System.nanoTime()); }
                                    });
                            save(immediate ? executor : task -> {});
                        });
                        requestTimes.add((System.nanoTime() - before) / 1_000_000.0);
                        Thread.sleep(50);
                    }
                    assertThat(completed.await(15, TimeUnit.SECONDS)).isTrue();
                    scheduler.shutdown();
                    assertThat(scheduler.awaitTermination(5, TimeUnit.SECONDS)).isTrue();
                }
                results.put(immediate ? "immediate" : "pollingOnly", java.util.Map.of(
                        "afterCommitToPublishStartMs", percentiles(startTimes),
                        "afterCommitToConfirmMs", percentiles(confirms),
                        "transactionCallMs", percentiles(requestTimes), "events", confirms.size(),
                        "unpublished", jdbc.queryForObject("select count(*) from chat_outbox where status<>'PUBLISHED'", Integer.class)));
            }
        } finally { connection.destroy(); }
        var output = java.nio.file.Path.of("build/reports/chat-outbox-benchmark.json");
        java.nio.file.Files.createDirectories(output.getParent());
        mapper.writerWithDefaultPrettyPrinter().writeValue(output.toFile(), results);
    }

    java.util.Map<String, Double> percentiles(java.util.List<Double> values) {
        var sorted = values.stream().sorted().toList();
        return java.util.Map.of("p50", sorted.get((int) Math.ceil(sorted.size() * .50) - 1),
                "p95", sorted.get((int) Math.ceil(sorted.size() * .95) - 1),
                "p99", sorted.get((int) Math.ceil(sorted.size() * .99) - 1));
    }

}
