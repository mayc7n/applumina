package com.lumina.domain.notification.repository;

import com.lumina.domain.notification.entity.Notification;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findTop50ByUserIdOrderByCreatedAtDesc(UUID userId);
    long countByUserIdAndReadFalse(UUID userId);
    Optional<Notification> findByIdAndUserId(UUID id, UUID userId);

    @Modifying
    @Query("""
        update Notification notification
        set notification.read = true, notification.readAt = :readAt
        where notification.user.id = :userId and notification.read = false
        """)
    int markAllRead(@Param("userId") UUID userId, @Param("readAt") Instant readAt);
}
