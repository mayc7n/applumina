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

@Entity @Table(name="labels")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode(of="id")
public class Label {
    @Id @UuidGenerator @Column(name="id",updatable=false,nullable=false) private UUID id;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="user_id",nullable=false) private User user;
    @Column(name="name",nullable=false,length=50) private String name;
    @Column(name="color",nullable=false,length=20) @Builder.Default private String color="#6366f1";
    @Column(name="icon",length=50) private String icon;
}
