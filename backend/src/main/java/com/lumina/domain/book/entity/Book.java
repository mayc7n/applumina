package com.lumina.domain.book.entity;
import com.lumina.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import java.time.*;
import java.util.*;

@Entity @Table(name="books")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode(of="id")
public class Book {
    @Id @UuidGenerator @Column(name="id",updatable=false,nullable=false) private UUID id;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="user_id",nullable=false) private User user;
    @Column(name="title",nullable=false,length=300) private String title;
    @Column(name="author",length=300) private String author;
    @Column(name="cover_url",length=500) private String coverUrl;
    @Column(name="total_pages") private Integer totalPages;
    @Column(name="current_page",nullable=false) @Builder.Default private int currentPage=0;
    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.NAMED_ENUM) @Column(name="status",nullable=false) @Builder.Default private ReadingStatus status=ReadingStatus.WANT_TO_READ;
    @Column(name="rating") private Short rating;
    @Column(name="review",columnDefinition="TEXT") private String review;
    @Column(name="genre",length=100) private String genre;
    @Column(name="started_at") private LocalDate startedAt;
    @Column(name="finished_at") private LocalDate finishedAt;
    @Column(name="google_books_id",length=50) private String googleBooksId;
    @Column(name="tags",columnDefinition="text[]") @Builder.Default private List<String> tags=List.of();
    @CreationTimestamp @Column(name="created_at",updatable=false,nullable=false) private Instant createdAt;
    @UpdateTimestamp @Column(name="updated_at",nullable=false) private Instant updatedAt;
    public int getProgressPct(){ return totalPages==null||totalPages==0?0:Math.min(100,(int)((double)currentPage/totalPages*100)); }
}
