package com.lumina.domain.focus.entity;
import com.lumina.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Entity @Table(name="focus_statistics")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class FocusStatistics {
    @Id @Column(name="user_id",nullable=false) private UUID userId;
    @Column(name="total_sessions",nullable=false) @Builder.Default private int totalSessions=0;
    @Column(name="total_focus_mins",nullable=false) @Builder.Default private int totalFocusMins=0;
    @Column(name="avg_session_mins",nullable=false,precision=6,scale=1) @Builder.Default private BigDecimal avgSessionMins=BigDecimal.ZERO;
    @Column(name="avg_focus_score",nullable=false,precision=4,scale=1) @Builder.Default private BigDecimal avgFocusScore=BigDecimal.ZERO;
    @Column(name="longest_streak_days",nullable=false) @Builder.Default private int longestStreakDays=0;
    @Column(name="current_streak_days",nullable=false) @Builder.Default private int currentStreakDays=0;
    @UpdateTimestamp @Column(name="updated_at",nullable=false) private Instant updatedAt;
}
