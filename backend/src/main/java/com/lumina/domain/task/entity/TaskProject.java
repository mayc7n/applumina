package com.lumina.domain.task.entity;
import com.lumina.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Entity @Table(name="task_projects")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode(of="id")
public class TaskProject {
    @Id @UuidGenerator @Column(name="id",updatable=false,nullable=false) private UUID id;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="user_id",nullable=false) private User user;
    @Column(name="name",nullable=false,length=100) private String name;
    @Column(name="description",length=500) private String description;
    @Column(name="color",nullable=false,length=20) @Builder.Default private String color="#6366f1";
    @Column(name="icon",length=50) private String icon;
    @Column(name="order_index",nullable=false) @Builder.Default private int orderIndex=0;
    @Column(name="archived_at") private Instant archivedAt;
    @CreationTimestamp @Column(name="created_at",updatable=false,nullable=false) private Instant createdAt;
}
