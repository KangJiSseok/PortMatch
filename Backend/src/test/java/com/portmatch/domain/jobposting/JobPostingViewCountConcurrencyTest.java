package com.portmatch.domain.jobposting;

import com.portmatch.domain.companies.repository.CompanyRepository;
import com.portmatch.domain.companies.service.CompaniesService;
import com.portmatch.domain.jobposting.controller.JobPostingController;
import com.portmatch.domain.jobposting.embedding.service.JobPostingEmbeddingService;
import com.portmatch.domain.jobposting.repository.JobPostingRepository;
import com.portmatch.domain.jobposting.repository.PostingStackRepository;
import com.portmatch.domain.jobposting.repository.TechStackRepository;
import com.portmatch.domain.jobposting.service.JobPostingService;
import com.portmatch.domain.jobposting.service.JobPostingServiceImpl;
import com.portmatch.domain.scrap.repository.ScrapRepository;
import com.portmatch.global.exception.BusinessException;
import com.portmatch.global.response.ResponseCode;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.Session;
import org.hibernate.resource.jdbc.spi.StatementInspector;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.RepeatedTest;
import org.junit.jupiter.api.RepetitionInfo;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.orm.jpa.EntityManagerHolder;
import org.springframework.orm.jpa.support.OpenEntityManagerInViewFilter;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DataJpaTest(showSql = false, properties = {
        "spring.flyway.enabled=false", "spring.sql.init.mode=never",
        "spring.jpa.hibernate.ddl-auto=none",
        "spring.datasource.hikari.maximum-pool-size=24"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Import({JobPostingServiceImpl.class, JobPostingViewCountConcurrencyTest.SqlHook.class})
@org.springframework.test.context.ContextConfiguration(classes = JobPostingViewCountConcurrencyTest.SqlHook.class)
@Testcontainers
class JobPostingViewCountConcurrencyTest {
    @Container
    static final PostgreSQLContainer<?> DB = new PostgreSQLContainer<>(
            DockerImageName.parse("pgvector/pgvector:pg17").asCompatibleSubstituteFor("postgres"))
            .withInitScript("db/view-count-init.sql");

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", DB::getJdbcUrl);
        registry.add("spring.datasource.username", DB::getUsername);
        registry.add("spring.datasource.password", DB::getPassword);
    }

    @MockitoBean CompanyRepository companyRepository;
    @MockitoBean TechStackRepository techStackRepository;
    @MockitoBean PostingStackRepository postingStackRepository;
    @MockitoBean CompaniesService companiesService;
    @MockitoBean ScrapRepository scrapRepository;
    @MockitoBean JobPostingEmbeddingService embeddingService;
    @Autowired JobPostingService service;
    @Autowired JobPostingRepository repository;
    @Autowired EntityManagerFactory emf;
    @Autowired JdbcTemplate jdbc;
    private MockMvc mvc;
    private long id;

    @BeforeEach
    void setup() {
        var osiv = new OpenEntityManagerInViewFilter() {
            @Override protected EntityManagerFactory lookupEntityManagerFactory() { return emf; }
        };
        mvc = MockMvcBuilders.standaloneSetup(new JobPostingController(service)).setControllerAdvice(new com.portmatch.global.exception.GlobalExceptionHandler()).addFilters(osiv).build();
        id = jdbc.queryForObject("INSERT INTO job_postings (title, active, job_type, vcnt, detail) " +
                "VALUES ('concurrency-fixture', 1, 2, 100, 'unchanged') RETURNING id", Long.class);
    }

    @org.junit.jupiter.api.AfterEach
    void cleanup() {
        jdbc.update("DELETE FROM job_postings WHERE id=?", id);
        setSqlLogging(false);
    }

    @RepeatedTest(20)
    void deterministicPair(RepetitionInfo repetition) throws Exception {
        run("pair", repetition.getCurrentRepetition(), 2, 2);
    }

    @RepeatedTest(10)
    void concurrentThousand(RepetitionInfo repetition) throws Exception {
        run("load", repetition.getCurrentRepetition(), 1000, 20);
    }

    private void run(String scenario, int repetition, int requests, int concurrency) throws Exception {
        setSqlLogging(requests == 2);
        var barrier = requests == 2 ? new CyclicBarrier(2) : null;
        var probes = new ArrayList<Probe>();
        var futures = new ArrayList<Future<?>>();
        var failures = new ArrayList<String>();
        var start = new CountDownLatch(1);
        var executor = Executors.newFixedThreadPool(concurrency);
        int success = 0;
        try {
            for (int i = 0; i < requests; i++) {
                var probe = new Probe(emf, barrier, id);
                probes.add(probe);
                futures.add(executor.submit(() -> {
                    if (!start.await(30, TimeUnit.SECONDS)) throw new IllegalStateException("start timeout");
                    SqlHook.CURRENT.set(probe);
                    try {
                        mvc.perform(get("/api/job-postings/{id}", id))
                                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value(true))
                                .andExpect(jsonPath("$.data.id").value(id))
                                .andExpect(jsonPath("$.data.title").value("concurrency-fixture"));
                        assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
                    } finally { SqlHook.CURRENT.remove(); }
                    return null;
                }));
            }
            start.countDown();
            for (var future : futures) {
                try { future.get(90, TimeUnit.SECONDS); success++; }
                catch (Exception e) { failures.add(e.toString()); }
            }
        } finally {
            executor.shutdownNow();
            assertThat(executor.awaitTermination(30, TimeUnit.SECONDS)).isTrue();
        }
        int actual = jdbc.queryForObject("SELECT vcnt FROM job_postings WHERE id=?", Integer.class, id);
        int expected = 100 + success;
        String row = String.format("%s,%d,100,%d,%d,%d,%d,%d,%d,%d,%s%n", scenario, repetition,
                requests, concurrency, success, failures.size(), expected, actual, expected - actual,
                failures.isEmpty() && actual == expected);
        Path output = Path.of("build/view-count-results.csv");
        Files.createDirectories(output.getParent());
        Files.writeString(output, row, StandardOpenOption.CREATE, StandardOpenOption.APPEND);
        System.out.print("VIEW_COUNT_RESULT " + row);
        if (barrier != null) {
            probes.forEach(p -> System.out.println("INDEPENDENT_TX " + p));
            assertThat(probes.stream().map(p -> p.session).distinct().count()).isEqualTo(2);
            assertThat(probes.stream().map(p -> p.pid).distinct().count()).isEqualTo(2);
            assertThat(probes.stream().map(p -> p.txid).distinct().count()).isEqualTo(2);
            assertThat(probes).allSatisfy(p -> assertThat(p.previous).isEqualTo(100));
        }
        assertThat(failures).isEmpty();
        assertThat(actual).as(row).isEqualTo(expected);
    }

    @Test
    void singleRequestAndMissingId() throws Exception {
        mvc.perform(get("/api/job-postings/{id}", id)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.vcnt").value(101))
                .andExpect(jsonPath("$.data.detail").value("unchanged"))
                .andExpect(jsonPath("$.data.active").value(1))
                .andExpect(jsonPath("$.data.jobType").value(2));
        assertThat(repository.findById(id).orElseThrow().getVcnt()).isEqualTo(101);
        assertThatThrownBy(() -> service.updateViewCount(-1L)).isInstanceOfSatisfying(
                BusinessException.class, e -> assertThat(e.getResponseCode()).isEqualTo(ResponseCode.NOT_FOUND));
        mvc.perform(get("/api/job-postings/-1")).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(2001));
        System.out.println("DB_VERSION " + jdbc.queryForObject("SELECT version()", String.class));
        System.out.println("DB_ISOLATION " + jdbc.queryForObject("SHOW default_transaction_isolation", String.class));
    }

    private static void setSqlLogging(boolean enabled) {
        ((ch.qos.logback.classic.Logger) org.slf4j.LoggerFactory.getLogger("org.springframework.orm.jpa.JpaTransactionManager"))
                .setLevel(enabled ? ch.qos.logback.classic.Level.DEBUG : ch.qos.logback.classic.Level.WARN);
        ((ch.qos.logback.classic.Logger) org.slf4j.LoggerFactory.getLogger("org.hibernate.SQL"))
                .setLevel(enabled ? ch.qos.logback.classic.Level.DEBUG : ch.qos.logback.classic.Level.WARN);
        ((ch.qos.logback.classic.Logger) org.slf4j.LoggerFactory.getLogger("org.hibernate.orm.jdbc.bind"))
                .setLevel(enabled ? ch.qos.logback.classic.Level.TRACE : ch.qos.logback.classic.Level.WARN);
    }

    static class Probe {
        final EntityManagerFactory emf;
        final CyclicBarrier barrier;
        final long postingId;
        String session;
        long pid, txid;
        int previous;
        Probe(EntityManagerFactory emf, CyclicBarrier barrier, long postingId) {
            this.emf = emf; this.barrier = barrier; this.postingId = postingId;
        }
        @Override public String toString() {
            return "session=" + session + " pid=" + pid + " txid=" + txid + " previous=" + previous;
        }
    }

    @TestConfiguration
    @org.springframework.boot.autoconfigure.domain.EntityScan("com.portmatch.domain")
    @org.springframework.data.jpa.repository.config.EnableJpaRepositories(basePackageClasses = JobPostingRepository.class)
    static class SqlHook {
        static final ThreadLocal<Probe> CURRENT = new ThreadLocal<>();
        @Bean HibernatePropertiesCustomizer viewCountInspector() {
            return properties -> properties.put("hibernate.session_factory.statement_inspector", (StatementInspector) sql -> {
                Probe p = CURRENT.get();
                if (p != null && p.barrier != null && sql.toLowerCase().startsWith("update job_postings ")) {
                    assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isTrue();
                    var holder = (EntityManagerHolder) TransactionSynchronizationManager.getResource(p.emf);
                    var session = holder.getEntityManager().unwrap(Session.class);
                    p.session = session.unwrap(org.hibernate.engine.spi.SharedSessionContractImplementor.class)
                            .getSessionIdentifier().toString();
                    session.doWork(connection -> {
                        try (var statement = connection.createStatement(); var rs = statement.executeQuery(
                                "SELECT pg_backend_pid(), txid_current(), vcnt FROM job_postings WHERE id=" + p.postingId)) {
                            rs.next(); p.pid = rs.getLong(1); p.txid = rs.getLong(2); p.previous = rs.getInt(3);
                        }
                    });
                    try { p.barrier.await(30, TimeUnit.SECONDS); }
                    catch (Exception e) { throw new IllegalStateException("UPDATE barrier failed", e); }
                }
                return sql;
            });
        }
    }
}
