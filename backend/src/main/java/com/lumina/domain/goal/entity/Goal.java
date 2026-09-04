package com.lumina.domain.goal.entity;
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

@Entity @Table(name="goals")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode(of="id")
public class Goal {
    @Id @UuidGenerator @Column(name="id",updatable=false,nullable=false) private UUID id;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="user_id",nullable=false) private User user;
    @Column(name="title",nullable=false,length=200) private String title;
    @Column(name="description",columnDefinition="TEXT") private String description;
    @Column(name="icon",length=50) private String icon;  // Lucide icon key
    @Column(name="color",nullable=false,length=20) @Builder.Default private String color="#8b5cf6";
    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.NAMED_ENUM) @Column(name="status",nullable=false) @Builder.Default private GoalStatus status=GoalStatus.ACTIVE;
    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.NAMED_ENUM) @Column(name="period",nullable=false) @Builder.Default private GoalPeriod period=GoalPeriod.YEARLY;
    @Column(name="start_date",nullable=false) @Builder.Default private LocalDate startDate=LocalDate.now();
    @Column(name="end_date") private LocalDate endDate;
    @Column(name="target_value",precision=10,scale=2) private BigDecimal targetValue;
    @Column(name="current_value",nullable=false,precision=10,scale=2) @Builder.Default private BigDecimal currentValue=BigDecimal.ZERO;
    @Column(name="unit",length=50) private String unit;
    @Column(name="progress_pct",nullable=false,precision=5,scale=2) @Builder.Default private BigDecimal progressPct=BigDecimal.ZERO;
    @Column(name="is_public",nullable=false) @Builder.Default private boolean isPublic=false;
    @Column(name="completed_at") private Instant completedAt;
    @CreationTimestamp @Column(name="created_at",updatable=false,nullable=false) private Instant createdAt;
    @UpdateTimestamp @Column(name="updated_at",nullable=false) private Instant updatedAt;

    public void updateProgress() {
        if (targetValue!=null && targetValue.compareTo(BigDecimal.ZERO)>0) {
            progressPct=currentValue.multiply(BigDecimal.valueOf(100)).divide(targetValue,2,java.math.RoundingMode.HALF_UP).min(BigDecimal.valueOf(100));
        }
        if (progressPct.compareTo(BigDecimal.valueOf(100))>=0 && status==GoalStatus.ACTIVE) {
            status=GoalStatus.COMPLETED; completedAt=Instant.now();
        }
    }
}
