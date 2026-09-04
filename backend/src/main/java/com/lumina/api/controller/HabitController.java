package com.lumina.api.controller;

import com.lumina.api.dto.*;
import com.lumina.application.service.HabitService;
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
@RequestMapping("/habits")
@RequiredArgsConstructor
public class HabitController {
    private final HabitService habitService;

    @GetMapping
    public ApiResponse<List<HabitResponse>> findAll(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(habitService.findAll(principal.getUserId()));
    }

    @GetMapping("/today/completions")
    public ApiResponse<List<UUID>> todayCompletions(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(habitService.todayCompletions(principal.getUserId()));
    }

    @GetMapping("/{habitId}")
    public ApiResponse<HabitDetailResponse> findById(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID habitId
    ) {
        return ApiResponse.success(habitService.findById(principal.getUserId(), habitId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<HabitResponse> create(
        @AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody CreateHabitRequest request
    ) {
        return ApiResponse.success(habitService.create(principal.getUserId(), request));
    }

    @PutMapping("/{habitId}")
    public ApiResponse<HabitResponse> update(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID habitId,
        @Valid @RequestBody UpdateHabitRequest request
    ) {
        return ApiResponse.success(habitService.update(principal.getUserId(), habitId, request));
    }

    @DeleteMapping("/{habitId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void archive(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID habitId) {
        habitService.archive(principal.getUserId(), habitId);
    }

    @PostMapping("/{habitId}/complete")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<HabitCompletionDto> complete(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID habitId,
        @RequestBody(required = false) CompleteHabitRequest request
    ) {
        return ApiResponse.success(habitService.complete(principal.getUserId(), habitId, request));
    }

    @DeleteMapping("/{habitId}/complete")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void uncomplete(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID habitId,
        @Valid @RequestBody(required = false) UncompleteHabitRequest request
    ) {
        LocalDate date = request != null && request.date() != null ? request.date() : LocalDate.now();
        habitService.uncomplete(principal.getUserId(), habitId, date);
    }

    @GetMapping("/{habitId}/completions")
    public ApiResponse<List<HabitCompletionDto>> completions(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID habitId,
        @RequestParam(required = false) LocalDate from, @RequestParam(required = false) LocalDate to
    ) {
        return ApiResponse.success(habitService.completions(principal.getUserId(), habitId, from, to));
    }

    @GetMapping("/{habitId}/streak")
    public ApiResponse<HabitStreakResponse> streak(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID habitId
    ) {
        return ApiResponse.success(habitService.streak(principal.getUserId(), habitId));
    }
}
