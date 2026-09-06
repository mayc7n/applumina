package com.lumina.api.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.lumina.api.dto.ApiResponse;
import com.lumina.api.dto.CreateWorkoutRequest;
import com.lumina.api.dto.WorkoutResponse;
import com.lumina.application.service.WorkoutService;
import com.lumina.infrastructure.security.UserPrincipal;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/workouts")
@RequiredArgsConstructor
public class WorkoutController {
    private final WorkoutService workoutService;

    @GetMapping
    public ApiResponse<List<WorkoutResponse>> list(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(workoutService.list(principal.getUserId()));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<WorkoutResponse> create(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody CreateWorkoutRequest request
    ) {
        return ApiResponse.success(workoutService.create(principal.getUserId(), request));
    }
}
