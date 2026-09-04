package com.lumina.domain.focus.entity;
import com.lumina.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

public enum SessionStatus{ ACTIVE, COMPLETED, ABANDONED, PAUSED }
