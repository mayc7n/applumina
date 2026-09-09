package com.lumina.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.lumina.domain.social.entity.UserBlock;
import com.lumina.domain.social.entity.UserReport;
import com.lumina.domain.social.repository.UserBlockRepository;
import com.lumina.domain.social.repository.UserReportRepository;
import com.lumina.infrastructure.security.DatabaseUserContextAspect;
import com.lumina.infrastructure.security.UserPrincipal;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(DatabaseUserContextAspect.class)
@Testcontainers
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class SocialSafetyPersistenceIntegrationTest {
    private static final String APP_USERNAME = "lumina_app_test";
    private static final String APP_PASSWORD = "test-only-password";

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    private static JdbcTemplate ownerJdbc;

    @Autowired private UserBlockRepository userBlockRepository;
    @Autowired private UserReportRepository userReportRepository;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private PlatformTransactionManager transactionManager;

    private UUID aliceId;
    private UUID bobId;
    private UUID charlieId;

    @DynamicPropertySource
    static void configurePostgres(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        prepareAppRole();
        registry.add("spring.datasource.username", () -> APP_USERNAME);
        registry.add("spring.datasource.password", () -> APP_PASSWORD);
        registry.add("spring.flyway.user", POSTGRES::getUsername);
        registry.add("spring.flyway.password", POSTGRES::getPassword);
    }

    @BeforeEach
    void setUp() {
        ownerJdbc.execute("TRUNCATE TABLE user_reports, user_blocks, users CASCADE");
        aliceId = insertUser("alice");
        bobId = insertUser("bob");
        charlieId = insertUser("charlie");
    }

    @Test
    void keepsBlocksOwnerControlledAndReportsHiddenFromTarget() {
        authenticated(aliceId, () -> userBlockRepository.saveAndFlush(block(aliceId, bobId)));
        authenticated(bobId, () -> assertThat(userBlockRepository.findByBlockerId(bobId)).isEmpty());
        authenticated(aliceId, () -> userReportRepository.saveAndFlush(report(aliceId, bobId)));
        authenticated(bobId, () -> assertThat(userReportRepository.findAll()).isEmpty());
    }

    @Test
    void enforcesBlockAndReportBoundariesAcrossIndependentTransactions() {
        authenticated(aliceId, () -> userBlockRepository.saveAndFlush(block(aliceId, bobId)));

        authenticated(aliceId, () -> assertThat(userBlockRepository.existsBetween(aliceId, bobId)).isTrue());
        authenticated(bobId, () -> assertThat(userBlockRepository.existsBetween(aliceId, bobId)).isTrue());
        authenticated(charlieId, () -> assertThat(userBlockRepository.existsBetween(aliceId, bobId)).isFalse());
        withoutContext(() -> assertThat(userBlockRepository.existsBetween(aliceId, bobId)).isFalse());

        assertThatThrownBy(() ->
            authenticated(bobId, () -> userBlockRepository.saveAndFlush(block(aliceId, bobId)))
        ).hasMessageContaining("row-level security policy");
        authenticated(bobId, () -> assertThat(userBlockRepository.deleteOwned(aliceId, bobId)).isZero());
        authenticated(aliceId, () -> assertThat(userBlockRepository.deleteOwned(aliceId, bobId)).isOne());

        assertThatThrownBy(() ->
            authenticated(bobId, () -> userReportRepository.saveAndFlush(report(aliceId, bobId)))
        ).hasMessageContaining("row-level security policy");
    }

    private UUID insertUser(String username) {
        UUID id = UUID.randomUUID();
        ownerJdbc.update(
            "INSERT INTO users (id, email, username, display_name) VALUES (?, ?, ?, ?)",
            id, username + "@example.test", username, username
        );
        return id;
    }

    private UserBlock block(UUID blockerId, UUID blockedId) {
        return UserBlock.builder().blockerId(blockerId).blockedId(blockedId).build();
    }

    private UserReport report(UUID reporterId, UUID reportedUserId) {
        return UserReport.builder()
            .reporterId(reporterId)
            .reportedUserId(reportedUserId)
            .category("HARASSMENT")
            .details("Unwanted contact")
            .build();
    }

    private void authenticated(UUID actorId, ThrowingAction action) {
        UserPrincipal principal = UserPrincipal.builder()
            .userId(actorId)
            .email(actorId + "@example.test")
            .role("USER")
            .build();
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(principal, null, List.of())
        );
        try {
            inTransaction(() -> {
                jdbc.queryForObject(
                    "SELECT set_config('lumina.user_id', ?, true)",
                    String.class,
                    actorId.toString()
                );
                action.run();
            });
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    private void withoutContext(ThrowingAction action) {
        SecurityContextHolder.clearContext();
        inTransaction(action);
    }

    private void inTransaction(ThrowingAction action) {
        TransactionTemplate transaction = new TransactionTemplate(transactionManager);
        transaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        transaction.executeWithoutResult(status -> action.run());
    }

    private static void prepareAppRole() {
        try (Connection connection = DriverManager.getConnection(
            POSTGRES.getJdbcUrl(),
            POSTGRES.getUsername(),
            POSTGRES.getPassword()
        )) {
            connection.createStatement().execute("""
                CREATE ROLE lumina_app_test
                    LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS
                    PASSWORD 'test-only-password'
                """);
            connection.createStatement().execute("GRANT CONNECT ON DATABASE test TO lumina_app_test");
            connection.createStatement().execute("GRANT USAGE ON SCHEMA public TO lumina_app_test");
            connection.createStatement().execute("""
                ALTER DEFAULT PRIVILEGES IN SCHEMA public
                    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO lumina_app_test
                """);
            connection.createStatement().execute("""
                ALTER DEFAULT PRIVILEGES IN SCHEMA public
                    GRANT USAGE, SELECT ON SEQUENCES TO lumina_app_test
                """);
            connection.createStatement().execute("""
                ALTER DEFAULT PRIVILEGES IN SCHEMA public
                    GRANT EXECUTE ON FUNCTIONS TO lumina_app_test
                """);
            ownerJdbc = new JdbcTemplate(new DriverManagerDataSource(
                POSTGRES.getJdbcUrl(),
                POSTGRES.getUsername(),
                POSTGRES.getPassword()
            ));
        } catch (SQLException exception) {
            throw new IllegalStateException("Could not prepare restricted database role", exception);
        }
    }

    @FunctionalInterface
    private interface ThrowingAction {
        void run();
    }
}
