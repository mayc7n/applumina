package com.lumina.domain.workout.entity;

import java.time.Instant;
import java.util.UUID;
import com.lumina.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

@Entity @Table(name = "workout_media")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode(of = "id")
public class WorkoutMedia {
    @Id @UuidGenerator @Column(name = "id", updatable = false, nullable = false) private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "workout_id", nullable = false) private Workout workout;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false) private User user;
    @Column(name = "storage_key", nullable = false, unique = true, length = 255) private String storageKey;
    @Enumerated(EnumType.STRING) @Column(name = "status", nullable = false, length = 16) @Builder.Default private WorkoutMediaStatus status = WorkoutMediaStatus.PENDING;
    @Column(name = "caption", length = 280) private String caption;
    @Column(name = "content_type", nullable = false, length = 100) private String contentType;
    @Column(name = "byte_size", nullable = false) private long byteSize;
    @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    @UpdateTimestamp @Column(name = "updated_at", nullable = false) private Instant updatedAt;
}
