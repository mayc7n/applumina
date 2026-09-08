package com.lumina.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
class FriendshipMigrationIntegrationTest {
    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    @Test
    void abortsWithoutDeletingWhenReciprocalDuplicatesAlreadyExist() {
        DriverManagerDataSource dataSource = new DriverManagerDataSource(
            POSTGRES.getJdbcUrl(),
            POSTGRES.getUsername(),
            POSTGRES.getPassword()
        );
        Flyway.configure().dataSource(dataSource).target("9").load().migrate();
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        UUID aliceId = UUID.randomUUID();
        UUID bobId = UUID.randomUUID();
        insertUser(jdbc, aliceId, "alice");
        insertUser(jdbc, bobId, "bob");
        jdbc.update(
            "INSERT INTO friendships (requester_id, addressee_id) VALUES (?, ?), (?, ?)",
            aliceId, bobId, bobId, aliceId
        );

        assertThatThrownBy(() ->
            Flyway.configure().dataSource(dataSource).target("10").load().migrate()
        ).hasMessageContaining("Cannot enforce unique friendship pairs: duplicate pair for users")
            .hasMessageContaining("This migration deleted no rows");

        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM friendships", Integer.class)).isEqualTo(2);
        assertThat(jdbc.queryForObject(
            "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'ux_friendships_user_pair'",
            Integer.class
        )).isZero();
        assertThat(jdbc.queryForObject(
            "SELECT COUNT(*) FROM pg_constraint WHERE conname = 'friendships_requester_id_addressee_id_key'",
            Integer.class
        )).isOne();
    }

    private void insertUser(JdbcTemplate jdbc, UUID id, String username) {
        jdbc.update(
            "INSERT INTO users (id, email, username, display_name) VALUES (?, ?, ?, ?)",
            id, username + "@example.test", username, username
        );
    }
}
