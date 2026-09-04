package com.lumina.domain.social.entity;

import com.lumina.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "friendships")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Friendship {
    @Id @UuidGenerator @Column(name = "id", updatable = false, nullable = false) private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "requester_id", nullable = false) private User requester;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "addressee_id", nullable = false) private User addressee;
    @Column(name = "status", nullable = false, length = 20) @Builder.Default private String status = "PENDING";
    @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    @UpdateTimestamp @Column(name = "updated_at", nullable = false) private Instant updatedAt;
}
