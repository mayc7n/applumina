package com.lumina.api.controller;

import com.lumina.api.dto.ApiResponse;
import com.lumina.api.dto.NotificationResponse;
import com.lumina.application.service.NotificationService;
import com.lumina.infrastructure.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping
    public ApiResponse<List<NotificationResponse>> getNotifications(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ApiResponse.success(notificationService.list(principal.getUserId()));
    }

    @GetMapping("/unread-count")
    public ApiResponse<UnreadCountResponse> getUnreadCount(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ApiResponse.success(new UnreadCountResponse(
            notificationService.unreadCount(principal.getUserId())
        ));
    }

    @PatchMapping("/{notificationId}/read")
    public ApiResponse<Void> markRead(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID notificationId
    ) {
        notificationService.markRead(principal.getUserId(), notificationId);
        return ApiResponse.success(null);
    }

    @PatchMapping("/read-all")
    public ApiResponse<Void> markAllRead(@AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markAllRead(principal.getUserId());
        return ApiResponse.success(null);
    }

    @DeleteMapping("/{notificationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID notificationId
    ) {
        notificationService.delete(principal.getUserId(), notificationId);
    }

    private record UnreadCountResponse(long count) {}
}
