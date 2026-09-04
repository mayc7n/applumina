package com.lumina.domain.study.entity;

import com.lumina.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "study_subjects")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class StudySubject {
    @Id @UuidGenerator @Column(name = "id", updatable = false, nullable = false)
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Column(name = "name", nullable = false, length = 200) private String name;
    @Column(name = "description", length = 500) private String description;
    @Column(name = "color", nullable = false, length = 20) @Builder.Default private String color = "#6366f1";
    @Column(name = "icon", length = 50) private String icon;
    @Column(name = "goal_hours", precision = 6, scale = 1) private BigDecimal goalHours;
    @Column(name = "is_archived", nullable = false) @Builder.Default private boolean archived = false;
    @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
}
