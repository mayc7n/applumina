package com.lumina.domain.book.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "book_reading_logs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class BookReadingLog {
    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "pages_read", nullable = false)
    private int pagesRead;

    @Column(name = "duration_mins")
    private Integer durationMins;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "logged_at", nullable = false)
    @Builder.Default
    private LocalDate loggedAt = LocalDate.now();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
