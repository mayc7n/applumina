package com.lumina.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.lenient;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.time.Instant;
import java.sql.SQLException;

import com.lumina.api.middleware.GlobalExceptionHandler.BusinessException;
import com.lumina.api.middleware.GlobalExceptionHandler.ResourceNotFoundException;
import com.lumina.api.middleware.GlobalExceptionHandler.ConflictException;
import com.lumina.api.dto.CreateUserReportRequest;
import com.lumina.domain.social.entity.UserBlock;
import com.lumina.domain.social.entity.UserReport;
import com.lumina.domain.social.repository.UserBlockRepository;
import com.lumina.domain.social.repository.UserReportRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.dao.DataIntegrityViolationException;
import org.hibernate.exception.ConstraintViolationException;

import com.lumina.domain.social.entity.Friendship;
import com.lumina.domain.social.repository.FriendshipRepository;
import com.lumina.domain.task.entity.Task;
import com.lumina.domain.task.entity.TaskStatus;
import com.lumina.domain.task.repository.TaskRepository;
import com.lumina.domain.user.entity.User;
import com.lumina.domain.user.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class SocialServiceTest {
    @Mock private FriendshipRepository friendshipRepository;
    @Mock private UserRepository userRepository;
    @Mock private TaskRepository taskRepository;
    @Mock private UserBlockRepository userBlockRepository;
    @Mock private UserReportRepository userReportRepository;

    private SocialService socialService;
    private UUID userId;
    private User user;
    private User otherUser;

    @BeforeEach
    void setUp() {
        socialService = new SocialService(friendshipRepository, userRepository, userBlockRepository, userReportRepository);
        userId = UUID.randomUUID();
        user = User.builder().id(userId).displayName("Pessoa").username("pessoa").build();
        otherUser = User.builder()
            .id(UUID.randomUUID())
            .displayName("Outra pessoa")
            .username("outra")
            .build();
    }

    @Test
    void distinguishesSentAndReceivedPendingRequestsInSearch() {
        when(userRepository.searchActiveUsers(userId, "ou", Pageable.ofSize(20)))
            .thenReturn(List.of(otherUser));
        when(friendshipRepository.findBetween(userId, otherUser.getId()))
            .thenReturn(Optional.of(Friendship.builder()
                .requester(user)
                .addressee(otherUser)
                .status("PENDING")
                .build()));

        var sent = socialService.search(userId, " ou ");

        assertThat(sent).singleElement()
            .extracting(response -> response.friendshipStatus())
            .isEqualTo("PENDING_SENT");

        when(friendshipRepository.findBetween(userId, otherUser.getId()))
            .thenReturn(Optional.of(Friendship.builder()
                .requester(otherUser)
                .addressee(user)
                .status("PENDING")
                .build()));

        var received = socialService.search(userId, "ou");

        assertThat(received).singleElement()
            .extracting(response -> response.friendshipStatus())
            .isEqualTo("PENDING_RECEIVED");
    }

    @Test
    void limitsFriendsAndPendingRequestsToOneHundredItems() {
        when(friendshipRepository.findAcceptedByUserId(any(UUID.class), any(Pageable.class)))
            .thenReturn(List.of());
        when(friendshipRepository.findPendingForUser(any(UUID.class), any(Pageable.class)))
            .thenReturn(List.of());

        socialService.friends(userId);
        socialService.pending(userId);

        ArgumentCaptor<Pageable> friendsPage = ArgumentCaptor.forClass(Pageable.class);
        ArgumentCaptor<Pageable> requestsPage = ArgumentCaptor.forClass(Pageable.class);
        verify(friendshipRepository).findAcceptedByUserId(eq(userId), friendsPage.capture());
        verify(friendshipRepository).findPendingForUser(eq(userId), requestsPage.capture());
        assertThat(friendsPage.getValue().getPageSize()).isEqualTo(100);
        assertThat(requestsPage.getValue().getPageSize()).isEqualTo(100);
        Sort expectedSort = Sort.by(Sort.Order.desc("createdAt"), Sort.Order.asc("id"));
        assertThat(friendsPage.getValue().getSort()).isEqualTo(expectedSort);
        assertThat(requestsPage.getValue().getSort()).isEqualTo(expectedSort);
    }

    @Test
    void marksListedRequestsAsReceived() {
        Friendship request = Friendship.builder()
            .id(UUID.randomUUID())
            .requester(otherUser)
            .addressee(user)
            .status("PENDING")
            .createdAt(Instant.parse("2030-06-10T12:00:00Z"))
            .build();
        when(friendshipRepository.findPendingForUser(eq(userId), any(Pageable.class)))
            .thenReturn(List.of(request));

        var pending = socialService.pending(userId);

        assertThat(pending).singleElement()
            .extracting(response -> response.user().friendshipStatus())
            .isEqualTo("PENDING_RECEIVED");
    }

    @Test
    void cancelsOnlyPendingRequestCreatedByCurrentUser() {
        when(friendshipRepository.deletePendingSentTo(userId, otherUser.getId()))
            .thenReturn(1);

        socialService.cancelRequest(userId, otherUser.getId());
    }

    @Test
    void rejectsOnlyPendingRequestReceivedByCurrentUser() {
        UUID requestId = UUID.randomUUID();
        when(friendshipRepository.deletePendingReceived(requestId, userId))
            .thenReturn(1);

        socialService.rejectRequest(userId, requestId);
    }

    @Test
    void removesOnlyAcceptedFriendshipContainingCurrentUser() {
        when(friendshipRepository.deleteAcceptedBetween(userId, otherUser.getId()))
            .thenReturn(1);

        socialService.removeFriend(userId, otherUser.getId());
    }

    @Test
    void doesNotRemovePendingRequestThroughFriendRemoval() {
        when(friendshipRepository.deleteAcceptedBetween(userId, otherUser.getId()))
            .thenReturn(0);

        assertThatThrownBy(() -> socialService.removeFriend(userId, otherUser.getId()))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessage("Amizade não encontrada");
    }

    @Test
    void masksUnauthorizedOrStaleRequestActionsAsNotFound() {
        UUID requestId = UUID.randomUUID();
        when(friendshipRepository.deletePendingSentTo(userId, otherUser.getId())).thenReturn(0);
        when(friendshipRepository.deletePendingReceived(requestId, userId)).thenReturn(0);

        assertThatThrownBy(() -> socialService.cancelRequest(userId, otherUser.getId()))
            .isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> socialService.rejectRequest(userId, requestId))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void mapsOnlyTheUnorderedFriendshipPairConstraintToConflict() {
        DataIntegrityViolationException pairViolation = integrityViolation("ux_friendships_user_pair");
        when(userRepository.findActiveById(otherUser.getId())).thenReturn(Optional.of(otherUser));
        when(friendshipRepository.findBetween(userId, otherUser.getId())).thenReturn(Optional.empty());
        when(friendshipRepository.saveAndFlush(any(Friendship.class))).thenThrow(pairViolation);

        assertThatThrownBy(() -> socialService.request(userId, otherUser.getId()))
            .isInstanceOfSatisfying(BusinessException.class, error -> {
                assertThat(error.getStatus().value()).isEqualTo(409);
                assertThat(error.getCode()).isEqualTo("FRIENDSHIP_ALREADY_EXISTS");
            });
    }

    @Test
    void preservesUnrelatedIntegrityViolations() {
        DataIntegrityViolationException unrelatedViolation = integrityViolation("users_email_key");
        when(userRepository.findActiveById(otherUser.getId())).thenReturn(Optional.of(otherUser));
        when(friendshipRepository.findBetween(userId, otherUser.getId())).thenReturn(Optional.empty());
        when(friendshipRepository.saveAndFlush(any(Friendship.class))).thenThrow(unrelatedViolation);

        assertThatThrownBy(() -> socialService.request(userId, otherUser.getId()))
            .isSameAs(unrelatedViolation);
    }

    @Test
    void doesNotExposeCompletedTaskWithoutExplicitConsent() {
        Friendship friendship = Friendship.builder()
            .requester(user)
            .addressee(otherUser)
            .status("ACCEPTED")
            .build();
        Task completedTask = Task.builder()
            .id(UUID.randomUUID())
            .user(otherUser)
            .title("Tarefa privada")
            .status(TaskStatus.DONE)
            .completedAt(Instant.parse("2030-06-10T12:00:00Z"))
            .build();
        lenient().when(friendshipRepository.findAcceptedByUserId(eq(userId), any(Pageable.class)))
            .thenReturn(List.of(friendship));
        lenient().when(taskRepository.findRecentCompletedByUsers(any(), any(Pageable.class)))
            .thenReturn(List.of(completedTask));

        var feed = socialService.feed(userId);

        assertThat(feed).isEmpty();
        verifyNoInteractions(friendshipRepository, taskRepository);
    }

    private DataIntegrityViolationException integrityViolation(String constraintName) {
        ConstraintViolationException cause = new ConstraintViolationException(
            "constraint violation",
            new SQLException("duplicate", "23505"),
            constraintName
        );
        return new DataIntegrityViolationException("integrity violation", cause);
    }

    @Test
    void blockingRemovesRelationshipUnderTheSameLockAsRequests() {
        when(userRepository.findActiveById(otherUser.getId())).thenReturn(Optional.of(otherUser));

        socialService.block(userId, otherUser.getId());

        var order = org.mockito.Mockito.inOrder(friendshipRepository, userBlockRepository);
        order.verify(friendshipRepository).lockPair(userId, otherUser.getId());
        order.verify(userBlockRepository).createIfAbsent(userId, otherUser.getId());
        order.verify(friendshipRepository).deleteBetween(userId, otherUser.getId());
    }

    @Test
    void blockedRequestsLookLikeMissingUsersAndNeverWriteFriendships() {
        when(userBlockRepository.existsBetween(userId, otherUser.getId())).thenReturn(true);

        assertThatThrownBy(() -> socialService.request(userId, otherUser.getId()))
            .isInstanceOf(ResourceNotFoundException.class).hasMessage("Usuário não encontrado");

        var order = org.mockito.Mockito.inOrder(friendshipRepository, userBlockRepository);
        order.verify(friendshipRepository).lockPair(userId, otherUser.getId());
        order.verify(userBlockRepository).existsBetween(userId, otherUser.getId());
        verify(friendshipRepository, org.mockito.Mockito.never()).saveAndFlush(any());
    }

    @Test
    void hidesBlockedPairsFromSearchFriendsAndReceivedRequests() {
        Friendship friendship = Friendship.builder().requester(otherUser).addressee(user).build();
        when(userBlockRepository.existsBetween(userId, otherUser.getId())).thenReturn(true);
        when(userRepository.searchActiveUsers(eq(userId), eq("ou"), any())).thenReturn(List.of(otherUser));
        when(friendshipRepository.findAcceptedByUserId(eq(userId), any())).thenReturn(List.of(friendship));
        when(friendshipRepository.findPendingForUser(eq(userId), any())).thenReturn(List.of(friendship));

        assertThat(socialService.search(userId, "ou")).isEmpty();
        assertThat(socialService.friends(userId)).isEmpty();
        assertThat(socialService.pending(userId)).isEmpty();
    }

    @Test
    void blockedRequestCannotBeAccepted() {
        UUID requestId = UUID.randomUUID();
        Friendship friendship = Friendship.builder().id(requestId).requester(otherUser)
            .addressee(user).status("PENDING").build();
        when(friendshipRepository.findByIdAndAddresseeIdAndStatus(requestId, userId, "PENDING"))
            .thenReturn(Optional.of(friendship));
        when(userBlockRepository.existsBetween(userId, otherUser.getId())).thenReturn(true);

        assertThatThrownBy(() -> socialService.accept(userId, requestId))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessage("Solicitação de amizade não encontrada");
        assertThat(friendship.getStatus()).isEqualTo("PENDING");
    }

    @Test
    void unblockOnlyDeletesOwnedBlockAndNeverRestoresRelationship() {
        socialService.unblock(userId, otherUser.getId());
        verify(userBlockRepository).deleteOwned(userId, otherUser.getId());
        verify(friendshipRepository, org.mockito.Mockito.never()).saveAndFlush(any());
    }

    @Test
    void blockedListContainsOnlyOwnedBlocksWithoutPresence() {
        otherUser.setLastSeenAt(Instant.now());
        when(userBlockRepository.findByBlockerId(userId)).thenReturn(List.of(
            UserBlock.builder().blockerId(userId).blockedId(otherUser.getId()).build()));
        when(userRepository.findActiveById(otherUser.getId())).thenReturn(Optional.of(otherUser));

        assertThat(socialService.blockedUsers(userId)).singleElement().satisfies(response -> {
            assertThat(response.id()).isEqualTo(otherUser.getId().toString());
            assertThat(response.isOnline()).isFalse();
            assertThat(response.friendshipStatus()).isNull();
        });
    }

    @Test
    void rejectsSelfBlockAndSelfReport() {
        assertThatThrownBy(() -> socialService.block(userId, userId)).isInstanceOf(ConflictException.class);
        assertThatThrownBy(() -> socialService.report(userId,
            new CreateUserReportRequest(userId, "SPAM", " detalhe "))).isInstanceOf(ConflictException.class);
        verifyNoInteractions(userBlockRepository, userReportRepository);
    }

    @Test
    void reportNormalizesDetailsAndDoesNotEchoThemInDiagnosticString() {
        when(userRepository.findActiveById(otherUser.getId())).thenReturn(Optional.of(otherUser));
        var request = new CreateUserReportRequest(otherUser.getId(), "SPAM", " detalhe privado ");

        socialService.report(userId, request);

        var report = ArgumentCaptor.forClass(UserReport.class);
        verify(userReportRepository).saveAndFlush(report.capture());
        assertThat(report.getValue().getReporterId()).isEqualTo(userId);
        assertThat(report.getValue().getReportedUserId()).isEqualTo(otherUser.getId());
        assertThat(report.getValue().getCategory()).isEqualTo("SPAM");
        assertThat(report.getValue().getDetails()).isEqualTo("detalhe privado");
        assertThat(report.getValue().getStatus()).isEqualTo("OPEN");
        assertThat(request.toString()).doesNotContain("detalhe privado");
    }

    @Test
    void rejectsInvalidReportCategoryAndOversizedDetailsBeforePersistence() {
        for (var request : List.of(
            new CreateUserReportRequest(otherUser.getId(), "INVALID", "detalhe"),
            new CreateUserReportRequest(otherUser.getId(), "SPAM", "x".repeat(1001)))) {
            assertThatThrownBy(() -> socialService.report(userId, request))
                .isInstanceOfSatisfying(BusinessException.class,
                    error -> assertThat(error.getStatus().value()).isEqualTo(422));
        }
        verifyNoInteractions(userReportRepository);
    }

    @Test
    void reportPersistenceFailuresDoNotEscapeWithPrivateDetails() {
        when(userRepository.findActiveById(otherUser.getId())).thenReturn(Optional.of(otherUser));
        when(userReportRepository.saveAndFlush(any())).thenThrow(
            new DataIntegrityViolationException("detalhe privado"));

        assertThatThrownBy(() -> socialService.report(userId,
            new CreateUserReportRequest(otherUser.getId(), "SPAM", "detalhe privado")))
            .isInstanceOf(BusinessException.class).hasNoCause()
            .hasMessageNotContaining("detalhe privado");
    }
}
