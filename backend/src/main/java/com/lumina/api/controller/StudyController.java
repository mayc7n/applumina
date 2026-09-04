package com.lumina.api.controller;

import com.lumina.api.dto.*;
import com.lumina.application.service.StudyService;
import com.lumina.infrastructure.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/studies")
@RequiredArgsConstructor
public class StudyController {
    private final StudyService studyService;

    @GetMapping("/subjects")
    public ApiResponse<List<StudySubjectResponse>> subjects(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(studyService.subjects(principal.getUserId()));
    }

    @PostMapping("/subjects")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<StudySubjectResponse> createSubject(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody CreateStudySubjectRequest request
    ) {
        return ApiResponse.success(studyService.createSubject(principal.getUserId(), request));
    }

    @GetMapping("/sessions")
    public ApiResponse<List<StudySessionResponse>> sessions(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(studyService.sessions(principal.getUserId()));
    }

    @PostMapping("/sessions")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<StudySessionResponse> createSession(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody CreateStudySessionRequest request
    ) {
        return ApiResponse.success(studyService.createSession(principal.getUserId(), request));
    }

    @PatchMapping("/sessions/{sessionId}/end")
    public ApiResponse<StudySessionResponse> endSession(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID sessionId,
        @Valid @RequestBody(required = false) EndStudySessionRequest request
    ) {
        Short quality = request != null ? request.quality() : null;
        String notes = request != null ? request.notes() : null;
        return ApiResponse.success(studyService.endSession(principal.getUserId(), sessionId, quality, notes));
    }
}
