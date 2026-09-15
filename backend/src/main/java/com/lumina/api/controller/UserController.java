package com.lumina.api.controller;

import com.lumina.api.dto.*;
import com.lumina.application.service.UserService;
import com.lumina.infrastructure.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final com.lumina.application.service.ProfileAvatarService profileAvatarService;

    @PostMapping("/me/avatar")
    public ApiResponse<UserResponse> uploadAvatar(@AuthenticationPrincipal UserPrincipal principal, @RequestPart("file") MultipartFile file) {
        return ApiResponse.success(UserResponse.from(profileAvatarService.upload(principal.getUserId(), file)));
    }

    @GetMapping("/me/avatar")
    public ResponseEntity<Resource> getAvatar(@AuthenticationPrincipal UserPrincipal principal) {
        try { return ResponseEntity.ok().header(HttpHeaders.CONTENT_TYPE, "image/jpeg").body(new ByteArrayResource(profileAvatarService.read(principal.getUserId()))); }
        catch (java.io.IOException e) { return ResponseEntity.notFound().build(); }
    }

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

    @PatchMapping("/me/password")
    public ApiResponse<Void> changePassword(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody ChangePasswordRequest request
    ) {
        userService.changePassword(
            principal.getUserId(),
            principal.getSessionId(),
            request.currentPassword(),
            request.newPassword()
        );
        return ApiResponse.success(null, "Senha alterada");
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
        userService.deleteAccount(
            principal.getUserId(),
            request.confirmation(),
            request.password()
        );
    }
}
