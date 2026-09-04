package com.lumina.domain.focus.entity;
import com.lumina.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Entity @Table(name="focus_sessions")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode(of="id")
public class FocusSession {
    @Id @UuidGenerator @Column(name="id",updatable=false,nullable=false) private UUID id;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="user_id",nullable=false) private User user;
    @Column(name="task_id") private UUID taskId;
    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.NAMED_ENUM) @Column(name="mode",nullable=false) @Builder.Default private FocusMode mode=FocusMode.POMODORO;
    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.NAMED_ENUM) @Column(name="status",nullable=false) @Builder.Default private SessionStatus status=SessionStatus.ACTIVE;
    @Column(name="planned_mins",nullable=false) private int plannedMins;
    @Column(name="actual_mins",nullable=false) @Builder.Default private int actualMins=0;
    @Column(name="breaks_taken",nullable=false) @Builder.Default private int breaksTaken=0;
    @Column(name="focus_score",precision=4,scale=1) private BigDecimal focusScore;
    @Column(name="notes",columnDefinition="TEXT") private String notes;
    @Column(name="started_at",nullable=false) @Builder.Default private Instant startedAt=Instant.now();
    @Column(name="completed_at") private Instant completedAt;
    @CreationTimestamp @Column(name="created_at",updatable=false,nullable=false) private Instant createdAt;
}
