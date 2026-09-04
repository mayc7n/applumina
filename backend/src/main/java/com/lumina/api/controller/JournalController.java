package com.lumina.api.controller;

import com.lumina.api.dto.*;
import com.lumina.application.service.JournalService;
import com.lumina.infrastructure.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/journal")
@RequiredArgsConstructor
public class JournalController {
    private final JournalService journalService;

    @GetMapping
    public ApiResponse<List<JournalEntryResponse>> findAll(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(required = false) String search
    ) {
        return ApiResponse.success(journalService.findAll(principal.getUserId(), search));
    }

    @GetMapping("/{entryId}")
    public ApiResponse<JournalEntryResponse> findById(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID entryId
    ) {
        return ApiResponse.success(journalService.findById(principal.getUserId(), entryId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<JournalEntryResponse> create(
        @AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody CreateJournalRequest request
    ) {
        return ApiResponse.success(journalService.create(principal.getUserId(), request));
    }

    @PutMapping("/{entryId}")
    public ApiResponse<JournalEntryResponse> update(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID entryId,
        @Valid @RequestBody UpdateJournalRequest request
    ) {
        return ApiResponse.success(journalService.update(principal.getUserId(), entryId, request));
    }

    @PatchMapping("/{entryId}/pin")
    public ApiResponse<JournalEntryResponse> togglePin(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID entryId
    ) {
        return ApiResponse.success(journalService.togglePin(principal.getUserId(), entryId));
    }

    @DeleteMapping("/{entryId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID entryId) {
        journalService.delete(principal.getUserId(), entryId);
    }
}
