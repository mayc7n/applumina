package com.lumina.domain.journal.entity;
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

@Entity @Table(name="journal_entries")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode(of="id")
public class JournalEntry {
    @Id @UuidGenerator @Column(name="id",updatable=false,nullable=false) private UUID id;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="user_id",nullable=false) private User user;
    @Column(name="title",length=300) private String title;
    @Column(name="content",nullable=false,columnDefinition="TEXT") private String content;
    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.NAMED_ENUM) @Column(name="mood") private MoodType mood;
    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.NAMED_ENUM) @Column(name="energy") private EnergyLevel energy;
    @Column(name="word_count",nullable=false) @Builder.Default private int wordCount=0;
    @Column(name="is_pinned",nullable=false) @Builder.Default private boolean pinned=false;
    @Column(name="entry_date",nullable=false) @Builder.Default private LocalDate entryDate=LocalDate.now();
    @Column(name="tags",columnDefinition="text[]") @Builder.Default private List<String> tags=List.of();
    @CreationTimestamp @Column(name="created_at",updatable=false,nullable=false) private Instant createdAt;
    @UpdateTimestamp @Column(name="updated_at",nullable=false) private Instant updatedAt;
    public void computeWordCount() {
        if(content!=null){ String p=content.replaceAll("<[^>]+>"," ").trim(); wordCount=p.isEmpty()?0:p.split("\\s+").length; }
    }
}
