package com.lumina.api.controller;

import com.lumina.api.dto.*;
import com.lumina.application.service.FocusService;
import com.lumina.infrastructure.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/focus")
@RequiredArgsConstructor
public class FocusController {
    private final FocusService focusService;

    @PostMapping("/sessions")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<FocusSessionResponse> start(
        @AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody StartFocusSessionRequest request
    ) {
        return ApiResponse.success(focusService.start(principal.getUserId(), request));
    }

    @PatchMapping("/sessions/{sessionId}/complete")
    public ApiResponse<FocusSessionResponse> complete(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID sessionId,
        @RequestBody(required = false) CompleteFocusSessionRequest request
    ) {
        return ApiResponse.success(focusService.complete(principal.getUserId(), sessionId, request));
    }

    @PatchMapping("/sessions/{sessionId}/abandon")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void abandon(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID sessionId) {
        focusService.abandon(principal.getUserId(), sessionId);
    }

    @GetMapping("/sessions")
    public ApiResponse<List<FocusSessionResponse>> history(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(required = false) LocalDate from, @RequestParam(required = false) LocalDate to
    ) {
        return ApiResponse.success(focusService.history(principal.getUserId(), from, to));
    }

    @GetMapping("/stats")
    public ApiResponse<FocusStatsResponse> stats(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(focusService.stats(principal.getUserId()));
    }
}
