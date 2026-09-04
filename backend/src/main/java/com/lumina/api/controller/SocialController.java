package com.lumina.api.controller;

import com.lumina.api.dto.*;
import com.lumina.application.service.SocialService;
import com.lumina.infrastructure.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import org.springframework.validation.annotation.Validated;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@Validated
@RequestMapping("/social")
@RequiredArgsConstructor
public class SocialController {
    private final SocialService socialService;

    @GetMapping("/feed")
    public ApiResponse<List<SocialFeedItemResponse>> feed(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(socialService.feed(principal.getUserId()));
    }

    @GetMapping("/friends")
    public ApiResponse<List<SocialUserResponse>> friends(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(socialService.friends(principal.getUserId()));
    }

    @GetMapping("/friends/requests")
    public ApiResponse<List<FriendRequestResponse>> pending(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(socialService.pending(principal.getUserId()));
    }

    @GetMapping("/users")
    public ApiResponse<List<SocialUserResponse>> search(
        @AuthenticationPrincipal UserPrincipal principal, @RequestParam @Size(min = 2, max = 100) String query
    ) {
        return ApiResponse.success(socialService.search(principal.getUserId(), query));
    }

    @PostMapping("/friends/request")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<FriendRequestResponse> request(
        @AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody CreateFriendRequest request
    ) {
        return ApiResponse.success(socialService.request(principal.getUserId(), request.userId()));
    }

    @PostMapping("/friends/request/{requestId}/accept")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void accept(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID requestId) {
        socialService.accept(principal.getUserId(), requestId);
    }
}
