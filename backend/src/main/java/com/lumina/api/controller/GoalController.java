package com.lumina.api.controller;

import com.lumina.api.dto.*;
import com.lumina.application.service.GoalService;
import com.lumina.infrastructure.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/goals")
@RequiredArgsConstructor
public class GoalController {
    private final GoalService goalService;

    @GetMapping
    public ApiResponse<List<GoalResponse>> findAll(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(required = false) String status
    ) {
        return ApiResponse.success(goalService.findAll(principal.getUserId(), status));
    }

    @GetMapping("/{goalId}")
    public ApiResponse<GoalDetailResponse> findById(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID goalId
    ) {
        return ApiResponse.success(goalService.findById(principal.getUserId(), goalId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<GoalResponse> create(
        @AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody CreateGoalRequest request
    ) {
        return ApiResponse.success(goalService.create(principal.getUserId(), request));
    }

    @PutMapping("/{goalId}")
    public ApiResponse<GoalResponse> update(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID goalId,
        @Valid @RequestBody UpdateGoalRequest request
    ) {
        return ApiResponse.success(goalService.update(principal.getUserId(), goalId, request));
    }

    @DeleteMapping("/{goalId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID goalId) {
        goalService.delete(principal.getUserId(), goalId);
    }

    @PostMapping("/{goalId}/check-in")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<GoalCheckInResponse> checkIn(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID goalId,
        @Valid @RequestBody GoalCheckInRequest request
    ) {
        return ApiResponse.success(goalService.checkIn(principal.getUserId(), goalId, request));
    }

    @GetMapping("/{goalId}/milestones")
    public ApiResponse<List<GoalMilestoneResponse>> milestones(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID goalId
    ) {
        return ApiResponse.success(goalService.milestones(principal.getUserId(), goalId));
    }

    @PostMapping("/{goalId}/milestones")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<GoalMilestoneResponse> createMilestone(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID goalId,
        @Valid @RequestBody CreateMilestoneRequest request
    ) {
        return ApiResponse.success(goalService.createMilestone(principal.getUserId(), goalId, request));
    }
}
