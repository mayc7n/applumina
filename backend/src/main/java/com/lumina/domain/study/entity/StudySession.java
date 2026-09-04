package com.lumina.domain.study.entity;

import com.lumina.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "study_sessions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class StudySession {
    @Id @UuidGenerator @Column(name = "id", updatable = false, nullable = false)
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "subject_id")
    private StudySubject subject;
    @Column(name = "title", length = 300) private String title;
    @Column(name = "notes", columnDefinition = "TEXT") private String notes;
    @Column(name = "duration_mins", nullable = false) @Builder.Default private int durationMins = 0;
    @Column(name = "quality") private Short quality;
    @Column(name = "session_date", nullable = false) @Builder.Default private LocalDate sessionDate = LocalDate.now();
    @Column(name = "started_at") @Builder.Default private Instant startedAt = Instant.now();
    @Column(name = "ended_at") private Instant endedAt;
    @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
}
