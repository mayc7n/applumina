package com.lumina.domain.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_sessions")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode(of = "id")
public class UserSession {
    @Id @UuidGenerator @Column(name = "id", updatable = false, nullable = false) private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false) private User user;
    @Column(name = "token_hash", nullable = false, unique = true, length = 255) private String tokenHash;
    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "device_type", nullable = false) @Builder.Default private DeviceType deviceType = DeviceType.DESKTOP;
    @Column(name = "device_name", length = 255) private String deviceName;
    @Column(name = "user_agent", columnDefinition = "TEXT") private String userAgent;
    @Column(name = "is_active", nullable = false) @Builder.Default private boolean active = true;
    @Column(name = "last_used_at", nullable = false) @Builder.Default private Instant lastUsedAt = Instant.now();
    @Column(name = "expires_at", nullable = false) private Instant expiresAt;
    @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;

    public boolean isUsable() { return active && expiresAt.isAfter(Instant.now()); }
    public void touch(Instant expiration) { lastUsedAt = Instant.now(); expiresAt = expiration; }
    public void revoke() { active = false; }
}
