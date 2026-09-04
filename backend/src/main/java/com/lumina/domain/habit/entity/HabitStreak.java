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

@Entity @Table(name="habit_streaks")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class HabitStreak {
    @Id @Column(name="habit_id",nullable=false) private UUID habitId;
    @Column(name="current_streak",nullable=false) @Builder.Default private int currentStreak=0;
    @Column(name="longest_streak",nullable=false) @Builder.Default private int longestStreak=0;
    @Column(name="last_completed") private LocalDate lastCompleted;
    @Column(name="total_completions",nullable=false) @Builder.Default private int totalCompletions=0;
    @UpdateTimestamp @Column(name="updated_at",nullable=false) private Instant updatedAt;
}
