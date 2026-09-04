package com.lumina.application.service;

import com.lumina.api.middleware.GlobalExceptionHandler.ResourceNotFoundException;
import com.lumina.domain.notification.entity.Notification;
import com.lumina.domain.notification.entity.NotificationType;
import com.lumina.domain.notification.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {
    @Mock
    private NotificationRepository notificationRepository;

    private NotificationService notificationService;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationService(notificationRepository);
    }

    @Test
    void listsOnlyCurrentUserNotificationsInRepositoryOrder() {
        UUID userId = UUID.randomUUID();
        Notification notification = Notification.builder()
            .id(UUID.randomUUID())
            .type(NotificationType.SYSTEM)
            .title("Atualização concluída")
            .body("Seus dados foram processados.")
            .createdAt(Instant.now())
            .build();
        when(notificationRepository.findTop50ByUserIdOrderByCreatedAtDesc(userId))
            .thenReturn(List.of(notification));

        var result = notificationService.list(userId);

        assertThat(result).singleElement().satisfies(item -> {
            assertThat(item.id()).isEqualTo(notification.getId());
            assertThat(item.type()).isEqualTo("SYSTEM");
            assertThat(item.title()).isEqualTo("Atualização concluída");
            assertThat(item.isRead()).isFalse();
        });
    }

    @Test
    void marksOwnedNotificationAsRead() {
        UUID userId = UUID.randomUUID();
        UUID notificationId = UUID.randomUUID();
        Notification notification = Notification.builder()
            .id(notificationId)
            .type(NotificationType.TASK_DUE)
            .title("Prazo próximo")
            .build();
        when(notificationRepository.findByIdAndUserId(notificationId, userId))
            .thenReturn(Optional.of(notification));

        notificationService.markRead(userId, notificationId);

        assertThat(notification.isRead()).isTrue();
        assertThat(notification.getReadAt()).isNotNull();
    }

    @Test
    void refusesToReadNotificationOutsideCurrentUser() {
        UUID userId = UUID.randomUUID();
        UUID notificationId = UUID.randomUUID();
        when(notificationRepository.findByIdAndUserId(notificationId, userId))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.markRead(userId, notificationId))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deletesOnlyOwnedNotification() {
        UUID userId = UUID.randomUUID();
        UUID notificationId = UUID.randomUUID();
        Notification notification = Notification.builder()
            .id(notificationId)
            .type(NotificationType.SYSTEM)
            .title("Aviso")
            .build();
        when(notificationRepository.findByIdAndUserId(notificationId, userId))
            .thenReturn(Optional.of(notification));

        notificationService.delete(userId, notificationId);

        verify(notificationRepository).delete(notification);
    }
}
