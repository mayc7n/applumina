package com.lumina.api.controller;

import java.util.List;
import java.util.UUID;
import java.time.LocalDate;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ResponseEntity;

import com.lumina.api.dto.ApiResponse;
import com.lumina.api.dto.CreateWorkoutRequest;
import com.lumina.api.dto.UpdateWorkoutRequest;
import com.lumina.api.dto.WorkoutResponse;
import com.lumina.api.dto.WorkoutMediaResponse;
import com.lumina.application.service.WorkoutService;
import com.lumina.application.service.WorkoutMediaService;
import com.lumina.infrastructure.security.UserPrincipal;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/workouts")
@RequiredArgsConstructor
public class WorkoutController {
    private final WorkoutService workoutService;
    private final WorkoutMediaService workoutMediaService;

    @PostMapping("/{workoutId}/moment")
    public ApiResponse<WorkoutMediaResponse> uploadMoment(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID workoutId, @RequestPart("file") MultipartFile file, @RequestParam(required = false) String caption) {
        return ApiResponse.success(workoutMediaService.upload(principal.getUserId(), workoutId, file, caption));
    }

    @GetMapping("/{workoutId}/moment")
    public ResponseEntity<Resource> getMoment(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID workoutId) {
        var media = workoutMediaService.get(principal.getUserId(), workoutId);
        try { return ResponseEntity.ok().header("Content-Type", media.getContentType()).body(new ByteArrayResource(workoutMediaService.read(media))); }
        catch (java.io.IOException e) { return ResponseEntity.notFound().build(); }
    }

    @DeleteMapping("/{workoutId}/moment")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMoment(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID workoutId) {
        workoutMediaService.delete(principal.getUserId(), workoutId);
    }

    @GetMapping
    public ApiResponse<List<WorkoutResponse>> list(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(workoutService.list(principal.getUserId()));
    }

    @GetMapping("/calendar")
    public ApiResponse<List<com.lumina.api.dto.WorkoutCalendarDayResponse>> calendar(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam LocalDate from,
        @RequestParam LocalDate to
    ) {
        return ApiResponse.success(workoutService.calendar(principal.getUserId(), from, to));
    }

    @GetMapping("/{workoutId}")
    public ApiResponse<WorkoutResponse> findById(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID workoutId
    ) {
        return ApiResponse.success(workoutService.findById(principal.getUserId(), workoutId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<WorkoutResponse> create(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody CreateWorkoutRequest request
    ) {
        return ApiResponse.success(workoutService.create(principal.getUserId(), request));
    }

    @PutMapping("/{workoutId}")
    public ApiResponse<WorkoutResponse> update(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID workoutId,
        @Valid @RequestBody UpdateWorkoutRequest request
    ) {
        return ApiResponse.success(workoutService.update(principal.getUserId(), workoutId, request));
    }

    @DeleteMapping("/{workoutId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID workoutId
    ) {
        workoutService.delete(principal.getUserId(), workoutId);
    }
}
