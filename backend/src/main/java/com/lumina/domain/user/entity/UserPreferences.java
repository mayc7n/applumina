package com.lumina.domain.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Entity
@Table(name = "user_preferences")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPreferences {
    @Id @Column(name = "user_id", nullable = false) private UUID userId;
    @Column(name = "theme", nullable = false, length = 20) @Builder.Default private String theme = "system";
    @Column(name = "accent_color", nullable = false, length = 20) @Builder.Default private String accentColor = "indigo";
    @Column(name = "week_starts_on", nullable = false) @Builder.Default private short weekStartsOn = 1;
    @Column(name = "daily_goal_hours", nullable = false, precision = 4, scale = 1) @Builder.Default private BigDecimal dailyGoalHours = BigDecimal.valueOf(4);
    @JdbcTypeCode(SqlTypes.JSON) @Column(name = "notification_settings", nullable = false, columnDefinition = "jsonb")
    @Builder.Default private Map<String, Boolean> notificationSettings = new HashMap<>();
    @JdbcTypeCode(SqlTypes.JSON) @Column(name = "focus_settings", nullable = false, columnDefinition = "jsonb")
    @Builder.Default private Map<String, Object> focusSettings = new HashMap<>();
    @JdbcTypeCode(SqlTypes.JSON) @Column(name = "privacy_settings", nullable = false, columnDefinition = "jsonb")
    @Builder.Default private Map<String, Object> privacySettings = new HashMap<>();
    @JdbcTypeCode(SqlTypes.JSON) @Column(name = "dashboard_layout", nullable = false, columnDefinition = "jsonb")
    @Builder.Default private Map<String, Object> dashboardLayout = new HashMap<>();
    @UpdateTimestamp @Column(name = "updated_at", nullable = false) private Instant updatedAt;
}
