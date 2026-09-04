package com.lumina.domain.user.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;
import java.time.Instant;
import java.util.*;

public enum DeviceType  { WEB, MOBILE_IOS, MOBILE_ANDROID, DESKTOP }
