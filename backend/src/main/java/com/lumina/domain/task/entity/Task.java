package com.lumina.domain.task.entity;
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

@Entity @Table(name="tasks")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode(of="id")
public class Task {
    @Id @UuidGenerator @Column(name="id",updatable=false,nullable=false) private UUID id;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="user_id",nullable=false) private User user;
    @Column(name="parent_task_id") private UUID parentTaskId;
    @Column(name="project_id") private UUID projectId;
    @Column(name="title",nullable=false,length=500) private String title;
    @Column(name="description",columnDefinition="TEXT") private String description;
    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.NAMED_ENUM) @Column(name="status",nullable=false) @Builder.Default private TaskStatus status=TaskStatus.TODO;
    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.NAMED_ENUM) @Column(name="priority",nullable=false) @Builder.Default private TaskPriority priority=TaskPriority.NONE;
    @Column(name="due_date") private LocalDate dueDate;
    @Column(name="scheduled_for") private LocalDate scheduledFor;
    @Column(name="estimated_mins") private Integer estimatedMins;
    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.NAMED_ENUM) @Column(name="recurrence_type",nullable=false) @Builder.Default private RecurrenceType recurrenceType=RecurrenceType.NONE;
    @Column(name="order_index",nullable=false) @Builder.Default private int orderIndex=0;
    @Column(name="is_inbox",nullable=false) @Builder.Default private boolean inbox=false;
    @Column(name="completed_at") private Instant completedAt;
    @CreationTimestamp @Column(name="created_at",updatable=false,nullable=false) private Instant createdAt;
    @UpdateTimestamp @Column(name="updated_at",nullable=false) private Instant updatedAt;
    @Column(name="deleted_at") private Instant deletedAt;
    public boolean isCompleted() { return status==TaskStatus.DONE; }
    public boolean isOverdue()   { return dueDate!=null && dueDate.isBefore(LocalDate.now()) && status!=TaskStatus.DONE; }
}
