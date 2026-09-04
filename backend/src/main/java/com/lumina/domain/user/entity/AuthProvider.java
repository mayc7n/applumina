package com.lumina.domain.user.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;
import java.time.Instant;
import java.util.*;

public enum AuthProvider{ LOCAL, GOOGLE, GITHUB, APPLE }
