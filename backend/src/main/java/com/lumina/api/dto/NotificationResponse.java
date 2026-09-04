package com.lumina.api.dto;

import com.lumina.domain.notification.entity.Notification;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record NotificationResponse(
    UUID id,
    String type,
    String title,
    String body,
    Map<String, Object> data,
    boolean isRead,
    Instant createdAt
) {
    public static NotificationResponse from(Notification notification) {
        return new NotificationResponse(
            notification.getId(),
            notification.getType().name(),
            notification.getTitle(),
            notification.getBody(),
            notification.getData(),
            notification.isRead(),
            notification.getCreatedAt()
        );
    }
}
