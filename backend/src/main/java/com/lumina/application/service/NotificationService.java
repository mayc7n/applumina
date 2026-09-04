package com.lumina.application.service;

import com.lumina.api.dto.NotificationResponse;
import com.lumina.api.middleware.GlobalExceptionHandler.ResourceNotFoundException;
import com.lumina.domain.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public List<NotificationResponse> list(UUID userId) {
        return notificationRepository.findTop50ByUserIdOrderByCreatedAtDesc(userId)
            .stream()
            .map(NotificationResponse::from)
            .toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public void markRead(UUID userId, UUID notificationId) {
        var notification = notificationRepository.findByIdAndUserId(notificationId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Notificação não encontrada"));
        notification.markRead();
    }

    @Transactional
    public void markAllRead(UUID userId) {
        notificationRepository.markAllRead(userId, Instant.now());
    }

    @Transactional
    public void delete(UUID userId, UUID notificationId) {
        var notification = notificationRepository.findByIdAndUserId(notificationId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Notificação não encontrada"));
        notificationRepository.delete(notification);
    }
}
