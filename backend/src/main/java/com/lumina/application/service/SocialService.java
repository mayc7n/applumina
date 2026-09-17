package com.lumina.application.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lumina.api.dto.*;
import com.lumina.api.middleware.GlobalExceptionHandler.BusinessException;
import com.lumina.api.middleware.GlobalExceptionHandler.ConflictException;
import com.lumina.api.middleware.GlobalExceptionHandler.ResourceNotFoundException;
import com.lumina.domain.social.entity.Friendship;
import com.lumina.domain.social.repository.FriendshipRepository;
import com.lumina.domain.social.repository.UserBlockRepository;
import com.lumina.domain.social.repository.UserReportRepository;
import com.lumina.domain.social.entity.UserReport;
import com.lumina.domain.user.entity.User;
import com.lumina.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataRetrievalFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.hibernate.exception.ConstraintViolationException;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SocialService {
    private static final String FRIENDSHIP_PAIR_CONSTRAINT = "ux_friendships_user_pair";
    private static final Sort FRIENDS_SORT = Sort.by(
        Sort.Order.desc("createdAt"), Sort.Order.asc("id")
    );
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final String FEED_QUERY = """
        SELECT p.id AS post_id, p.type, p.content,
               (SELECT COUNT(*) FROM post_likes visible_like WHERE visible_like.post_id = p.id) AS likes_count,
               EXISTS (
                   SELECT 1 FROM post_likes own_like
                   WHERE own_like.post_id = p.id AND own_like.user_id = ?
               ) AS liked,
               p.created_at,
               u.id AS user_id, u.display_name, u.username, u.last_seen_at,
               media.id AS media_id
        FROM social_posts p
        JOIN users u ON u.id = p.user_id
        LEFT JOIN workout_media media
            ON media.id::text = NULLIF(p.content->>'mediaId', '')
           AND media.status = 'READY'
        WHERE u.deleted_at IS NULL
          AND u.status = 'ACTIVE'
          AND (
              p.user_id = ?
              OR (
                  (p.privacy = 'PUBLIC'
                   OR (p.privacy = 'FRIENDS' AND EXISTS (
                       SELECT 1 FROM friendships friendship
                       WHERE friendship.status = 'ACCEPTED'
                         AND ((friendship.requester_id = ? AND friendship.addressee_id = p.user_id)
                           OR (friendship.addressee_id = ? AND friendship.requester_id = p.user_id))
                   )))
                  AND NOT EXISTS (
                      SELECT 1 FROM user_blocks block
                      WHERE (block.blocker_id = ? AND block.blocked_id = p.user_id)
                         OR (block.blocker_id = p.user_id AND block.blocked_id = ?)
                  )
              )
          )
        ORDER BY p.created_at DESC, p.id ASC
        LIMIT 100
        """;
    private static final String VISIBLE_MEDIA_QUERY = """
        SELECT media.storage_key, media.content_type
        FROM social_posts p
        JOIN users u ON u.id = p.user_id
        JOIN workout_media media
          ON media.id::text = NULLIF(p.content->>'mediaId', '')
         AND media.status = 'READY'
        WHERE p.id = ?
          AND u.deleted_at IS NULL
          AND u.status = 'ACTIVE'
          AND (
              p.user_id = ?
              OR (
                  (p.privacy = 'PUBLIC'
                   OR (p.privacy = 'FRIENDS' AND EXISTS (
                       SELECT 1 FROM friendships friendship
                       WHERE friendship.status = 'ACCEPTED'
                         AND ((friendship.requester_id = ? AND friendship.addressee_id = p.user_id)
                           OR (friendship.addressee_id = ? AND friendship.requester_id = p.user_id))
                   )))
                  AND NOT EXISTS (
                      SELECT 1 FROM user_blocks block
                      WHERE (block.blocker_id = ? AND block.blocked_id = p.user_id)
                         OR (block.blocker_id = p.user_id AND block.blocked_id = ?)
                  )
              )
          )
        LIMIT 1
        """;
    private static final String VISIBLE_POST_QUERY = """
        SELECT EXISTS (
            SELECT 1
            FROM social_posts p
            JOIN users u ON u.id = p.user_id
            WHERE p.id = ?
              AND u.deleted_at IS NULL
              AND u.status = 'ACTIVE'
              AND (
                  p.user_id = ?
                  OR (
                      (p.privacy = 'PUBLIC'
                       OR (p.privacy = 'FRIENDS' AND EXISTS (
                           SELECT 1 FROM friendships friendship
                           WHERE friendship.status = 'ACCEPTED'
                             AND ((friendship.requester_id = ? AND friendship.addressee_id = p.user_id)
                               OR (friendship.addressee_id = ? AND friendship.requester_id = p.user_id))
                       )))
                      AND NOT EXISTS (
                          SELECT 1 FROM user_blocks block
                          WHERE (block.blocker_id = ? AND block.blocked_id = p.user_id)
                             OR (block.blocker_id = p.user_id AND block.blocked_id = ?)
                      )
                  )
              )
        )
        """;

    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;
    private final UserBlockRepository userBlockRepository;
    private final UserReportRepository userReportRepository;
    private final JdbcTemplate jdbcTemplate;

    @Transactional(readOnly = true)
    public List<SocialUserResponse> friends(UUID userId) {
        return friendshipRepository.findAcceptedByUserId(userId, PageRequest.of(0, 100, FRIENDS_SORT)).stream()
            .filter(friendship -> !userBlockRepository.existsBetween(userId, other(friendship, userId).getId()))
            .map(friendship -> toSocialUser(other(friendship, userId), "ACCEPTED")).toList();
    }

    @Transactional(readOnly = true)
    public List<FriendRequestResponse> pending(UUID userId) {
        return friendshipRepository.findPendingForUser(userId, PageRequest.of(0, 100, FRIENDS_SORT)).stream()
            .filter(request -> !userBlockRepository.existsBetween(userId, request.getRequester().getId()))
            .map(request -> new FriendRequestResponse(
                request.getId().toString(), toSocialUser(request.getRequester(), "PENDING_RECEIVED"),
                request.getCreatedAt().toString()))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<SocialUserResponse> search(UUID userId, String query) {
        if (query == null || query.trim().length() < 2) return List.of();
        return userRepository.searchActiveUsers(userId, query.trim(), PageRequest.of(0, 20)).stream()
            .filter(user -> !userBlockRepository.existsBetween(userId, user.getId()))
            .map(user -> toSocialUser(user, friendshipStatus(
                friendshipRepository.findBetween(userId, user.getId()).orElse(null), userId)))
            .toList();
    }

    @Transactional
    public FriendRequestResponse request(UUID userId, UUID targetId) {
        if (userId.equals(targetId)) throw new ConflictException("Você não pode adicionar a si mesmo");
        friendshipRepository.lockPair(userId, targetId);
        if (userBlockRepository.existsBetween(userId, targetId)) {
            throw new ResourceNotFoundException("Usuário não encontrado");
        }
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
        friendshipRepository.lockPair(userId, friendship.getRequester().getId());
        if (userBlockRepository.existsBetween(userId, friendship.getRequester().getId())) {
            throw new ResourceNotFoundException("Solicitação de amizade não encontrada");
        }
        friendship = friendshipRepository.findByIdAndAddresseeIdAndStatus(requestId, userId, "PENDING")
            .orElseThrow(() -> new ResourceNotFoundException("Solicitação de amizade não encontrada"));
        friendship.setStatus("ACCEPTED");
    }

    @Transactional
    public void block(UUID userId, UUID targetId) {
        validateOtherActiveUser(userId, targetId);
        friendshipRepository.lockPair(userId, targetId);
        userBlockRepository.createIfAbsent(userId, targetId);
        friendshipRepository.deleteBetween(userId, targetId);
    }

    @Transactional
    public void unblock(UUID userId, UUID targetId) {
        friendshipRepository.lockPair(userId, targetId);
        userBlockRepository.deleteOwned(userId, targetId);
    }

    @Transactional(readOnly = true)
    public List<SocialUserResponse> blockedUsers(UUID userId) {
        return userBlockRepository.findBlockedUsersByBlockerId(userId).stream()
            .map(user -> new SocialUserResponse(user.getId().toString(), user.getDisplayName(),
                user.getUsername(), user.getAvatarUrl(), false, 0, null))
            .toList();
    }

    @Transactional
    public void report(UUID userId, CreateUserReportRequest request) {
        String category;
        try {
            category = CreateUserReportRequest.Category.valueOf(request.category()).name();
        } catch (IllegalArgumentException | NullPointerException exception) {
            throw new BusinessException("VALIDATION_ERROR", "Categoria inválida", HttpStatus.UNPROCESSABLE_ENTITY);
        }
        if (request.details() != null && request.details().length() > 1000) {
            throw new BusinessException("VALIDATION_ERROR", "Detalhes devem ter até 1000 caracteres", HttpStatus.UNPROCESSABLE_ENTITY);
        }
        validateOtherActiveUser(userId, request.userId());
        String details = request.details() == null ? null : request.details().strip();
        try {
            userReportRepository.saveAndFlush(UserReport.builder()
                .reporterId(userId).reportedUserId(request.userId()).category(category)
                .details(details == null || details.isEmpty() ? null : details).build());
        } catch (DataAccessException exception) {
            // Database exception messages can contain the report's private evidence.
            throw new BusinessException("INTERNAL_ERROR", "Não foi possível registrar a denúncia", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private User validateOtherActiveUser(UUID userId, UUID targetId) {
        if (userId.equals(targetId)) throw new ConflictException("Você não pode realizar esta ação consigo mesmo");
        return userRepository.findActiveById(targetId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
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
        return jdbcTemplate.query(
            FEED_QUERY,
            (resultSet, rowNumber) -> toFeedItem(resultSet),
            userId, userId, userId, userId, userId, userId
        );
    }

    @Transactional(readOnly = true)
    public VisibleMedia findVisibleMedia(UUID userId, UUID postId) {
        return jdbcTemplate.query(
            VISIBLE_MEDIA_QUERY,
            (resultSet, rowNumber) -> new VisibleMedia(
                resultSet.getString("storage_key"), resultSet.getString("content_type")
            ),
            postId, userId, userId, userId, userId, userId
        ).stream().findFirst().orElseThrow(() -> new ResourceNotFoundException("Mídia não encontrada"));
    }

    @Transactional
    public SocialLikeResponse like(UUID userId, UUID postId) {
        ensureVisiblePost(userId, postId);
        jdbcTemplate.update(
            "INSERT INTO post_likes (post_id, user_id) VALUES (?, ?) ON CONFLICT (post_id, user_id) DO NOTHING",
            postId, userId
        );
        return likeState(userId, postId);
    }

    @Transactional
    public SocialLikeResponse unlike(UUID userId, UUID postId) {
        ensureVisiblePost(userId, postId);
        jdbcTemplate.update("DELETE FROM post_likes WHERE post_id = ? AND user_id = ?", postId, userId);
        return likeState(userId, postId);
    }

    private void ensureVisiblePost(UUID userId, UUID postId) {
        boolean visible = Boolean.TRUE.equals(jdbcTemplate.queryForObject(
            VISIBLE_POST_QUERY,
            Boolean.class,
            postId, userId, userId, userId, userId, userId
        ));
        if (!visible) throw new ResourceNotFoundException("Post não encontrado");
    }

    private SocialLikeResponse likeState(UUID userId, UUID postId) {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM post_likes WHERE post_id = ?",
            Integer.class,
            postId
        );
        Boolean liked = jdbcTemplate.queryForObject(
            "SELECT EXISTS (SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?)",
            Boolean.class,
            postId, userId
        );
        return new SocialLikeResponse(Boolean.TRUE.equals(liked), count == null ? 0 : count);
    }

    private SocialFeedItemResponse toFeedItem(ResultSet resultSet) throws SQLException {
        JsonNode content;
        try {
            content = OBJECT_MAPPER.readTree(resultSet.getString("content"));
        } catch (JsonProcessingException exception) {
            throw new DataRetrievalFailureException("Post social inválido", exception);
        }

        String type = resultSet.getString("type");
        String caption = content.path("caption").asText("").strip();
        OffsetDateTime createdAt = resultSet.getObject("created_at", OffsetDateTime.class);
        OffsetDateTime lastSeenAt = resultSet.getObject("last_seen_at", OffsetDateTime.class);
        boolean online = lastSeenAt != null
            && lastSeenAt.toInstant().isAfter(Instant.now().minus(5, ChronoUnit.MINUTES));
        SocialUserResponse author = new SocialUserResponse(
            resultSet.getObject("user_id", UUID.class).toString(),
            resultSet.getString("display_name"),
            resultSet.getString("username"),
            null,
            online,
            0,
            null
        );
        return new SocialFeedItemResponse(
            resultSet.getObject("post_id", UUID.class).toString(),
            author,
            type,
            content.path("title").asText(type),
            caption.isEmpty() ? null : caption,
            type.equals("WORKOUT") ? "🏋️" : "✨",
            resultSet.getInt("likes_count"),
            resultSet.getBoolean("liked"),
            createdAt.toInstant().toString(),
            resultSet.getObject("media_id") == null
                ? null
                : "/social/posts/" + resultSet.getObject("post_id", UUID.class) + "/media"
        );
    }

    public record VisibleMedia(String storageKey, String contentType) {}

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
