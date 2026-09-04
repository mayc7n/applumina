package com.lumina.domain.habit.entity;
import com.lumina.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Entity @Table(name="habit_completions")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode(of="id")
public class HabitCompletion {
    @Id @UuidGenerator @Column(name="id",updatable=false,nullable=false) private UUID id;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="habit_id",nullable=false) private Habit habit;
    @Column(name="user_id",nullable=false) private UUID userId;
    @Column(name="completed_date",nullable=false) private LocalDate completedDate;
    @Column(name="value",nullable=false,precision=10,scale=2) @Builder.Default private BigDecimal value=BigDecimal.ONE;
    @Column(name="note",length=500) private String note;
    @CreationTimestamp @Column(name="created_at",updatable=false,nullable=false) private Instant createdAt;
}
