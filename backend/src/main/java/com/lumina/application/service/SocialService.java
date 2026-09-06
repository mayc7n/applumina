package com.lumina.application.service;

import com.lumina.api.dto.*;
import com.lumina.api.middleware.GlobalExceptionHandler.ConflictException;
import com.lumina.api.middleware.GlobalExceptionHandler.ResourceNotFoundException;
import com.lumina.domain.social.entity.Friendship;
import com.lumina.domain.social.repository.FriendshipRepository;
import com.lumina.domain.task.repository.TaskRepository;
import com.lumina.domain.user.entity.User;
import com.lumina.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SocialService {
    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;

    @Transactional(readOnly = true)
    public List<SocialUserResponse> friends(UUID userId) {
        return friendshipRepository.findAcceptedByUserId(userId, PageRequest.of(0, 100)).stream()
            .map(friendship -> toSocialUser(other(friendship, userId), "ACCEPTED")).toList();
    }

    @Transactional(readOnly = true)
    public List<FriendRequestResponse> pending(UUID userId) {
        return friendshipRepository.findPendingForUser(userId, PageRequest.of(0, 100)).stream()
            .map(request -> new FriendRequestResponse(
                request.getId().toString(), toSocialUser(request.getRequester(), "PENDING"),
                request.getCreatedAt().toString()))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<SocialUserResponse> search(UUID userId, String query) {
        if (query == null || query.trim().length() < 2) return List.of();
        return userRepository.searchActiveUsers(userId, query.trim(), PageRequest.of(0, 20)).stream()
            .map(user -> toSocialUser(user, friendshipStatus(
                friendshipRepository.findBetween(userId, user.getId()).orElse(null), userId)))
            .toList();
    }

    @Transactional
    public FriendRequestResponse request(UUID userId, UUID targetId) {
        if (userId.equals(targetId)) throw new ConflictException("Você não pode adicionar a si mesmo");
        User target = userRepository.findActiveById(targetId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
        if (friendshipRepository.findBetween(userId, targetId).isPresent()) {
            throw new ConflictException("Já existe uma solicitação ou amizade com este usuário");
        }
        Friendship request = friendshipRepository.saveAndFlush(Friendship.builder()
            .requester(userRepository.getReferenceById(userId)).addressee(target).build());
        return new FriendRequestResponse(request.getId().toString(), toSocialUser(target, "PENDING"), request.getCreatedAt().toString());
    }

    @Transactional
    public void accept(UUID userId, UUID requestId) {
        Friendship friendship = friendshipRepository.findByIdAndAddresseeIdAndStatus(requestId, userId, "PENDING")
            .orElseThrow(() -> new ResourceNotFoundException("Solicitação de amizade não encontrada"));
        friendship.setStatus("ACCEPTED");
    }

    @Transactional(readOnly = true)
    public List<SocialFeedItemResponse> feed(UUID userId) {
        List<UUID> friendIds = friendshipRepository.findAcceptedByUserId(userId, PageRequest.of(0, 100)).stream()
            .map(friendship -> other(friendship, userId).getId()).toList();
        if (friendIds.isEmpty()) return List.of();
        return taskRepository.findRecentCompletedByUsers(friendIds, PageRequest.of(0, 30)).stream()
            .map(task -> new SocialFeedItemResponse(
                task.getId().toString(), toSocialUser(task.getUser(), "ACCEPTED"),
                "task_completed", task.getTitle(), null, "check",
                0, false, task.getCompletedAt().toString()))
            .toList();
    }

    private User other(Friendship friendship, UUID userId) {
        return friendship.getRequester().getId().equals(userId) ? friendship.getAddressee() : friendship.getRequester();
    }

    private String friendshipStatus(Friendship friendship, UUID userId) {
        if (friendship == null || !"PENDING".equals(friendship.getStatus())) {
            return friendship == null ? null : friendship.getStatus();
        }
        return friendship.getRequester().getId().equals(userId)
            ? "PENDING_SENT"
            : "PENDING_RECEIVED";
    }

    private SocialUserResponse toSocialUser(User user, String status) {
        boolean online = user.getLastSeenAt() != null
            && user.getLastSeenAt().isAfter(Instant.now().minus(5, ChronoUnit.MINUTES));
        return new SocialUserResponse(
            user.getId().toString(), user.getDisplayName(), user.getUsername(),
            user.getAvatarUrl(), online, 0, status);
    }
}
