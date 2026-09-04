package com.lumina.domain.user.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.util.*;

@Entity @Table(name="users")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode(of="id")
public class User {
    @Id @UuidGenerator @Column(name="id",updatable=false,nullable=false) private UUID id;
    @Column(name="email",nullable=false,unique=true,length=255) private String email;
    @Column(name="username",nullable=false,unique=true,length=50) private String username;
    @Column(name="display_name",nullable=false,length=100) private String displayName;
    @Column(name="password_hash",length=255) private String passwordHash;
    @Column(name="avatar_url",length=500) private String avatarUrl;
    @Column(name="bio",length=500) private String bio;
    @Column(name="timezone",nullable=false,length=100) @Builder.Default private String timezone="America/Sao_Paulo";
    @Column(name="locale",nullable=false,length=10) @Builder.Default private String locale="pt-BR";
    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.NAMED_ENUM) @Column(name="status",nullable=false) @Builder.Default private UserStatus status=UserStatus.PENDING_VERIFICATION;
    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.NAMED_ENUM) @Column(name="role",nullable=false) @Builder.Default private UserRole role=UserRole.USER;
    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.NAMED_ENUM) @Column(name="plan",nullable=false) @Builder.Default private PlanType plan=PlanType.FREE;
    @Column(name="email_verified",nullable=false) @Builder.Default private boolean emailVerified=false;
    @Column(name="two_factor_enabled",nullable=false) @Builder.Default private boolean twoFactorEnabled=false;
    @Column(name="two_factor_secret",length=255) private String twoFactorSecret;
    @Column(name="onboarding_complete",nullable=false) @Builder.Default private boolean onboardingComplete=false;
    @Column(name="last_seen_at") private Instant lastSeenAt;
    @CreationTimestamp @Column(name="created_at",updatable=false,nullable=false) private Instant createdAt;
    @UpdateTimestamp @Column(name="updated_at",nullable=false) private Instant updatedAt;
    @Column(name="deleted_at") private Instant deletedAt;

    public boolean isActive()  { return status==UserStatus.ACTIVE && deletedAt==null; }
    public boolean isDeleted() { return deletedAt!=null; }
    public boolean isPro()     { return plan==PlanType.PRO||plan==PlanType.TEAM||plan==PlanType.ENTERPRISE; }
    public boolean isAdmin()   { return role==UserRole.ADMIN||role==UserRole.SUPER_ADMIN; }
    public void activate()     { this.status=UserStatus.ACTIVE; this.emailVerified=true; }
    public void updateLastSeen(){ this.lastSeenAt=Instant.now(); }
    public void softDelete()   { this.deletedAt=Instant.now(); this.status=UserStatus.DELETED; this.email="deleted_"+id+"@lumina.deleted"; }
}
