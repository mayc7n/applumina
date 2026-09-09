package com.lumina.application.service;

import com.lumina.api.dto.*;
import com.lumina.api.middleware.GlobalExceptionHandler.BusinessException;
import com.lumina.api.middleware.GlobalExceptionHandler.ConflictException;
import com.lumina.api.middleware.GlobalExceptionHandler.ResourceNotFoundException;
import com.lumina.domain.social.entity.Friendship;
import com.lumina.domain.social.repository.FriendshipRepository;
import com.lumina.domain.user.entity.User;
import com.lumina.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.hibernate.exception.ConstraintViolationException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SocialService {
    private static final String FRIENDSHIP_PAIR_CONSTRAINT = "ux_friendships_user_pair";
    private static final Sort FRIENDS_SORT = Sort.by(
        Sort.Order.desc("createdAt"), Sort.Order.asc("id")
    );

    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<SocialUserResponse> friends(UUID userId) {
        return friendshipRepository.findAcceptedByUserId(userId, PageRequest.of(0, 100, FRIENDS_SORT)).stream()
            .map(friendship -> toSocialUser(other(friendship, userId), "ACCEPTED")).toList();
    }

    @Transactional(readOnly = true)
    public List<FriendRequestResponse> pending(UUID userId) {
        return friendshipRepository.findPendingForUser(userId, PageRequest.of(0, 100, FRIENDS_SORT)).stream()
            .map(request -> new FriendRequestResponse(
                request.getId().toString(), toSocialUser(request.getRequester(), "PENDING_RECEIVED"),
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
            throw friendshipAlreadyExists();
        }
        try {
            Friendship request = friendshipRepository.saveAndFlush(Friendship.builder()
                .requester(userRepository.getReferenceById(userId)).addressee(target).build());
            return new FriendRequestResponse(request.getId().toString(), toSocialUser(target, "PENDING"), request.getCreatedAt().toString());
        } catch (DataIntegrityViolationException exception) {
            if (violatesFriendshipPairConstraint(exception)) {
                throw friendshipAlreadyExists();
            }
            throw exception;
        }
    }

    @Transactional
    public void accept(UUID userId, UUID requestId) {
        Friendship friendship = friendshipRepository.findByIdAndAddresseeIdAndStatus(requestId, userId, "PENDING")
            .orElseThrow(() -> new ResourceNotFoundException("Solicitação de amizade não encontrada"));
        friendship.setStatus("ACCEPTED");
    }

    @Transactional
    public void cancelRequest(UUID userId, UUID targetId) {
        if (friendshipRepository.deletePendingSentTo(userId, targetId) == 0) {
            throw new ResourceNotFoundException("Solicitação de amizade não encontrada");
        }
    }

    @Transactional
    public void rejectRequest(UUID userId, UUID requestId) {
        if (friendshipRepository.deletePendingReceived(requestId, userId) == 0) {
            throw new ResourceNotFoundException("Solicitação de amizade não encontrada");
        }
    }

    @Transactional
    public void removeFriend(UUID userId, UUID friendId) {
        if (friendshipRepository.deleteAcceptedBetween(userId, friendId) == 0) {
            throw new ResourceNotFoundException("Amizade não encontrada");
        }
    }

    @Transactional(readOnly = true)
    public List<SocialFeedItemResponse> feed(UUID userId) {
        return List.of();
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

    private BusinessException friendshipAlreadyExists() {
        return new BusinessException(
            "FRIENDSHIP_ALREADY_EXISTS",
            "Já existe uma solicitação ou amizade com este usuário",
            HttpStatus.CONFLICT
        );
    }

    private boolean violatesFriendshipPairConstraint(Throwable error) {
        Throwable cause = error;
        while (cause != null) {
            if (cause instanceof ConstraintViolationException violation
                && FRIENDSHIP_PAIR_CONSTRAINT.equals(violation.getConstraintName())) {
                return true;
            }
            cause = cause.getCause();
        }
        return false;
    }
}
