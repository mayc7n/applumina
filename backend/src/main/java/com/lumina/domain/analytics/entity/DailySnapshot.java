package com.lumina.domain.analytics.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Entity @Table(name="daily_snapshots")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode(of="id")
public class DailySnapshot {
    @Id @UuidGenerator @Column(name="id",updatable=false,nullable=false) private UUID id;
    @Column(name="user_id",nullable=false) private UUID userId;
    @Column(name="snapshot_date",nullable=false) @Builder.Default private java.time.LocalDate snapshotDate=java.time.LocalDate.now();
    @Column(name="tasks_completed",nullable=false) @Builder.Default private int tasksCompleted=0;
    @Column(name="tasks_created",nullable=false) @Builder.Default private int tasksCreated=0;
    @Column(name="habits_completed",nullable=false) @Builder.Default private int habitsCompleted=0;
    @Column(name="habits_total",nullable=false) @Builder.Default private int habitsTotal=0;
    @Column(name="focus_mins",nullable=false) @Builder.Default private int focusMins=0;
    @Column(name="study_mins",nullable=false) @Builder.Default private int studyMins=0;
    @Column(name="pages_read",nullable=false) @Builder.Default private int pagesRead=0;
    @Column(name="mood",length=20) private String mood;
    @Column(name="energy",length=20) private String energy;
    @Column(name="productivity_score",nullable=false,precision=4,scale=1) @Builder.Default private BigDecimal productivityScore=BigDecimal.ZERO;
    @CreationTimestamp @Column(name="created_at",updatable=false,nullable=false) private Instant createdAt;
}
