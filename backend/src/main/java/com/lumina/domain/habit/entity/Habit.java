package com.lumina.domain.habit.entity;
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

@Entity @Table(name="habits")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode(of="id")
public class Habit {
    @Id @UuidGenerator @Column(name="id",updatable=false,nullable=false) private UUID id;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="user_id",nullable=false) private User user;
    @Column(name="name",nullable=false,length=200) private String name;
    @Column(name="description",length=500) private String description;
    @Column(name="icon",length=50) private String icon;  // Lucide icon key, e.g. "flame"
    @Column(name="color",nullable=false,length=20) @Builder.Default private String color="#6366f1";
    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.NAMED_ENUM) @Column(name="habit_type",nullable=false) @Builder.Default private HabitType habitType=HabitType.BUILD;
    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.NAMED_ENUM) @Column(name="frequency",nullable=false) @Builder.Default private HabitFrequency frequency=HabitFrequency.DAILY;
    @Column(name="frequency_days",columnDefinition="integer[]") @Builder.Default private List<Integer> frequencyDays=List.of(1,2,3,4,5,6,7);
    @Column(name="target_value",nullable=false,precision=10,scale=2) @Builder.Default private BigDecimal targetValue=BigDecimal.ONE;
    @Column(name="target_unit",length=50) private String targetUnit;
    @Column(name="start_date",nullable=false) @Builder.Default private LocalDate startDate=LocalDate.now();
    @Column(name="end_date") private LocalDate endDate;
    @Column(name="reminder_time") private LocalTime reminderTime;
    @Column(name="order_index",nullable=false) @Builder.Default private int orderIndex=0;
    @Column(name="is_archived",nullable=false) @Builder.Default private boolean archived=false;
    @CreationTimestamp @Column(name="created_at",updatable=false,nullable=false) private Instant createdAt;
    @UpdateTimestamp @Column(name="updated_at",nullable=false) private Instant updatedAt;
}
