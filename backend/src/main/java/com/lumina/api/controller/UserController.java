package com.lumina.api.controller;

import com.lumina.api.dto.*;
import com.lumina.application.service.UserService;
import com.lumina.infrastructure.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @GetMapping("/me")
    public ApiResponse<UserResponse> getCurrentUser(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ApiResponse.success(userService.getCurrentUser(principal.getUserId()));
    }

    @PatchMapping("/me")
    public ApiResponse<UserResponse> updateProfile(
        @AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody UpdateProfileRequest request
    ) {
        return ApiResponse.success(userService.updateProfile(principal.getUserId(), request));
    }

    @GetMapping("/me/preferences")
    public ApiResponse<UserPreferencesResponse> getPreferences(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(userService.getPreferences(principal.getUserId()));
    }

    @PatchMapping("/me/preferences")
    public ApiResponse<UserPreferencesResponse> updatePreferences(
        @AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody UpdatePreferencesRequest request
    ) {
        return ApiResponse.success(userService.updatePreferences(principal.getUserId(), request));
    }

    @GetMapping(value = "/me/export", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<byte[]> export(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=lumina-data.json")
            .header(HttpHeaders.CACHE_CONTROL, "no-store")
            .header(HttpHeaders.PRAGMA, "no-cache")
            .body(userService.exportData(principal.getUserId()));
    }

    @DeleteMapping("/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
        @AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody DeleteAccountRequest request
    ) {
        userService.deleteAccount(principal.getUserId(), request.confirmation());
    }
}
