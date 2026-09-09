package com.lumina.application.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.concurrent.BrokenBarrierException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.aop.aspectj.annotation.AspectJProxyFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.lumina.api.middleware.GlobalExceptionHandler.BusinessException;
import com.lumina.api.middleware.GlobalExceptionHandler;
import com.lumina.api.middleware.GlobalExceptionHandler.ResourceNotFoundException;
import com.lumina.domain.social.repository.FriendshipRepository;
import com.lumina.domain.user.entity.User;
import com.lumina.domain.user.repository.UserRepository;
import com.lumina.infrastructure.security.DatabaseUserContextAspect;
import com.lumina.infrastructure.security.UserPrincipal;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({
    SocialService.class,
    DatabaseUserContextAspect.class,
    FriendshipConcurrencyIntegrationTest.BarrierConfiguration.class
})
@Testcontainers
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class FriendshipConcurrencyIntegrationTest {
    private static final String APP_USERNAME = "lumina_app_test";
    private static final String APP_PASSWORD = "test-only-password";

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    private static JdbcTemplate ownerJdbc;

    @DynamicPropertySource
    static void configurePostgres(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        prepareAppRole();
        registry.add("spring.datasource.username", () -> APP_USERNAME);
        registry.add("spring.datasource.password", () -> APP_PASSWORD);
        registry.add("spring.flyway.user", POSTGRES::getUsername);
        registry.add("spring.flyway.password", POSTGRES::getPassword);
    }

    @Autowired private SocialService socialService;
    @Autowired private FriendshipRepository friendshipRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private FriendshipLookupBarrier lookupBarrier;

    private ExecutorService executor;
    private User alice;
    private User bob;

    @BeforeEach
    void setUp() {
        ownerJdbc.execute("TRUNCATE TABLE friendships, users CASCADE");
        alice = saveUser("alice");
        bob = saveUser("bob");
        executor = Executors.newFixedThreadPool(2);
    }

    @AfterEach
    void tearDown() throws InterruptedException {
        lookupBarrier.disarm();
        executor.shutdownNow();
        executor.awaitTermination(5, TimeUnit.SECONDS);
    }

    @Test
    void persistsOneFriendshipWhenOppositeRequestsRace() throws Exception {
        lookupBarrier.arm();

        List<Attempt> attempts = runConcurrently(
            () -> requestAs(alice.getId(), bob.getId()),
            () -> requestAs(bob.getId(), alice.getId())
        );

        assertOneCreatedAndOneExpectedConflict(attempts);
        assertThat(lookupBarrier.backendPids()).hasSize(2);
        assertRestrictedAppRole();
        assertFriendshipCountOne();
    }

    @Test
    void persistsOneFriendshipWhenSameDirectionRequestsRace() throws Exception {
        lookupBarrier.arm();

        List<Attempt> attempts = runConcurrently(
            () -> requestAs(alice.getId(), bob.getId()),
            () -> requestAs(alice.getId(), bob.getId())
        );

        assertOneCreatedAndOneExpectedConflict(attempts);
        assertThat(lookupBarrier.backendPids()).hasSize(2);
        assertRestrictedAppRole();
        assertFriendshipCountOne();
    }

    @Test
    void preservesAcceptanceAndAddresseeAuthorization() {
        requestAs(alice.getId(), bob.getId());
        UUID friendshipId = ownerJdbc.queryForObject(
            "SELECT id FROM friendships",
            UUID.class
        );

        org.assertj.core.api.Assertions.assertThatThrownBy(
            () -> acceptAs(alice.getId(), friendshipId)
        ).isInstanceOf(ResourceNotFoundException.class);

        acceptAs(bob.getId(), friendshipId);

        assertThat(ownerJdbc.queryForObject(
            "SELECT status FROM friendships WHERE id = ?",
            String.class,
            friendshipId
        )).isEqualTo("ACCEPTED");
    }

    @Test
    void returnsTheSameApiConflictWhenThePairAlreadyExists() {
        requestAs(alice.getId(), bob.getId());

        Attempt duplicate = attempt(() -> requestAs(bob.getId(), alice.getId()));

        assertThat(duplicate.created()).isFalse();
        assertExpectedApiConflict(duplicate.error());
        assertFriendshipCountOne();
    }

    @Test
    void blockAndOppositeRequestRaceAlwaysEndsWithoutFriendship() throws Exception {
        lookupBarrier.arm();

        List<Attempt> attempts = runConcurrently(
            () -> authenticated(alice.getId(), () -> socialService.block(alice.getId(), bob.getId())),
            () -> requestAs(bob.getId(), alice.getId())
        );

        assertThat(attempts.get(0).created()).isTrue();
        if (!attempts.get(1).created()) {
            assertThat(attempts.get(1).error()).isInstanceOf(ResourceNotFoundException.class);
        }
        assertThat(lookupBarrier.backendPids()).hasSize(2);
        assertThat(ownerJdbc.queryForObject("SELECT COUNT(*) FROM user_blocks", Integer.class)).isOne();
        assertThat(ownerJdbc.queryForObject("SELECT COUNT(*) FROM friendships", Integer.class)).isZero();
        assertRestrictedAppRole();
    }

    @Test
    void concurrentRepeatedBlocksAreIdempotent() throws Exception {
        lookupBarrier.arm();

        List<Attempt> attempts = runConcurrently(
            () -> authenticated(alice.getId(), () -> socialService.block(alice.getId(), bob.getId())),
            () -> authenticated(alice.getId(), () -> socialService.block(alice.getId(), bob.getId()))
        );

        assertThat(attempts).allMatch(Attempt::created);
        assertThat(lookupBarrier.backendPids()).hasSize(2);
        assertThat(ownerJdbc.queryForObject("SELECT COUNT(*) FROM user_blocks", Integer.class)).isOne();
    }

    @Test
    void blocksAreBilateralButOnlyOwnedBlocksAreListedAndRemoved() {
        requestAs(bob.getId(), alice.getId());
        UUID requestId = ownerJdbc.queryForObject("SELECT id FROM friendships", UUID.class);
        authenticated(alice.getId(), () -> socialService.block(alice.getId(), bob.getId()));

        authenticated(bob.getId(), () -> {
            assertThat(socialService.blockedUsers(bob.getId())).isEmpty();
            assertThat(socialService.search(bob.getId(), "alice")).isEmpty();
            socialService.unblock(bob.getId(), alice.getId());
        });
        authenticated(alice.getId(), () -> {
            assertThat(socialService.blockedUsers(alice.getId())).singleElement()
                .extracting(response -> response.id()).isEqualTo(bob.getId().toString());
            assertThat(socialService.search(alice.getId(), "bob")).isEmpty();
            assertThat(socialService.pending(alice.getId())).isEmpty();
            assertThat(socialService.friends(alice.getId())).isEmpty();
        });
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> requestAs(bob.getId(), alice.getId()))
            .isInstanceOf(ResourceNotFoundException.class);
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> requestAs(alice.getId(), bob.getId()))
            .isInstanceOf(ResourceNotFoundException.class);
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> acceptAs(alice.getId(), requestId))
            .isInstanceOf(ResourceNotFoundException.class);

        authenticated(alice.getId(), () -> socialService.unblock(alice.getId(), bob.getId()));
        assertThat(ownerJdbc.queryForObject("SELECT COUNT(*) FROM friendships", Integer.class)).isZero();
        requestAs(bob.getId(), alice.getId());
        assertFriendshipCountOne();
    }

    @Test
    void inactiveBlockedAccountsRemainListedWithoutPresenceAndCanBeUnblocked() {
        authenticated(alice.getId(), () -> socialService.block(alice.getId(), bob.getId()));
        ownerJdbc.update("UPDATE users SET status = 'PENDING_VERIFICATION' WHERE id = ?", bob.getId());

        authenticated(alice.getId(), () -> {
            assertThat(socialService.blockedUsers(alice.getId())).singleElement().satisfies(response -> {
                assertThat(response.id()).isEqualTo(bob.getId().toString());
                assertThat(response.isOnline()).isFalse();
                assertThat(response.friendshipStatus()).isNull();
            });
            socialService.unblock(alice.getId(), bob.getId());
        });

        assertThat(ownerJdbc.queryForObject("SELECT COUNT(*) FROM user_blocks", Integer.class)).isZero();
    }

    @Test
    void searchFiltersBlockedAndInactiveUsersBeforePagination() {
        for (int index = 0; index < 21; index++) {
            User hidden = saveUser("match" + String.format("%02d", index));
            authenticated(alice.getId(), () -> socialService.block(alice.getId(), hidden.getId()));
        }
        User visible = saveUser("matchzz");
        User inactive = saveUser("matchinactive");
        ownerJdbc.update("UPDATE users SET status = 'PENDING_VERIFICATION' WHERE id = ?", inactive.getId());

        authenticated(alice.getId(), () -> assertThat(socialService.search(alice.getId(), "match"))
            .singleElement().extracting(response -> response.id()).isEqualTo(visible.getId().toString()));
    }

    private User saveUser(String username) {
        User user = User.builder()
            .email(username + "@example.test")
            .username(username)
            .displayName(username)
            .build();
        user.activate();
        return userRepository.saveAndFlush(user);
    }

    private void requestAs(UUID actorId, UUID targetId) {
        authenticated(actorId, () -> socialService.request(actorId, targetId));
    }

    private void acceptAs(UUID actorId, UUID requestId) {
        authenticated(actorId, () -> socialService.accept(actorId, requestId));
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
            action.run();
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    private void assertRestrictedAppRole() {
        assertThat(ownerJdbc.queryForMap(
            "SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = ?",
            APP_USERNAME
        )).containsEntry("rolsuper", false).containsEntry("rolbypassrls", false);
    }

    private void assertFriendshipCountOne() {
        assertThat(ownerJdbc.queryForObject(
            "SELECT COUNT(*) FROM friendships",
            Integer.class
        )).isOne();
    }

    private List<Attempt> runConcurrently(ThrowingAction first, ThrowingAction second)
        throws InterruptedException, ExecutionException, TimeoutException {
        Future<Attempt> firstAttempt = executor.submit(() -> attempt(first));
        Future<Attempt> secondAttempt = executor.submit(() -> attempt(second));
        return List.of(
            firstAttempt.get(10, TimeUnit.SECONDS),
            secondAttempt.get(10, TimeUnit.SECONDS)
        );
    }

    private Attempt attempt(ThrowingAction action) {
        try {
            action.run();
            return new Attempt(true, null);
        } catch (Throwable error) {
            return new Attempt(false, error);
        }
    }

    private void assertOneCreatedAndOneExpectedConflict(List<Attempt> attempts) {
        assertThat(attempts).filteredOn(Attempt::created).hasSize(1);
        assertThat(attempts).filteredOn(attempt -> !attempt.created())
            .singleElement()
            .extracting(Attempt::error)
            .satisfies(this::assertExpectedApiConflict);
    }

    private void assertExpectedApiConflict(Throwable error) {
        assertThat(error).isInstanceOfSatisfying(BusinessException.class, businessError -> {
            var apiResponse = new GlobalExceptionHandler().business(businessError);
            assertThat(apiResponse.getStatusCode().value()).isEqualTo(409);
            assertThat(apiResponse.getBody()).isNotNull();
            assertThat(apiResponse.getBody().error().code())
                .isEqualTo("FRIENDSHIP_ALREADY_EXISTS");
        });
    }

    @FunctionalInterface
    private interface ThrowingAction {
        void run();
    }

    private record Attempt(boolean created, Throwable error) {}

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

    @TestConfiguration
    @EnableAspectJAutoProxy(proxyTargetClass = true)
    static class BarrierConfiguration {
        @Bean
        FriendshipLookupBarrier friendshipLookupBarrier(JdbcTemplate jdbc) {
            return new FriendshipLookupBarrier(jdbc);
        }

        @Bean
        @Primary
        FriendshipRepository barrierFriendshipRepository(
            @Qualifier("friendshipRepository") FriendshipRepository repository,
            FriendshipLookupBarrier barrier
        ) {
            AspectJProxyFactory proxyFactory = new AspectJProxyFactory(repository);
            proxyFactory.addAspect(barrier);
            return proxyFactory.getProxy();
        }
    }

    @Aspect
    static class FriendshipLookupBarrier {
        private final JdbcTemplate jdbc;
        private final Set<Integer> backendPids = ConcurrentHashMap.newKeySet();
        private volatile CyclicBarrier barrier;

        FriendshipLookupBarrier(JdbcTemplate jdbc) {
            this.jdbc = jdbc;
        }

        void arm() {
            backendPids.clear();
            barrier = new CyclicBarrier(2);
        }

        void disarm() {
            barrier = null;
        }

        Set<Integer> backendPids() {
            return Set.copyOf(backendPids);
        }

        @Around("execution(* com.lumina.domain.social.repository.FriendshipRepository.lockPair(..))")
        Object awaitBothLookups(ProceedingJoinPoint joinPoint) throws Throwable {
            CyclicBarrier activeBarrier = barrier;
            if (activeBarrier != null) {
                backendPids.add(jdbc.queryForObject("SELECT pg_backend_pid()", Integer.class));
                try {
                    activeBarrier.await(5, TimeUnit.SECONDS);
                } catch (BrokenBarrierException | TimeoutException exception) {
                    throw new AssertionError("Concurrent friendship lookups did not overlap", exception);
                }
            }
            return joinPoint.proceed();
        }
    }
}
