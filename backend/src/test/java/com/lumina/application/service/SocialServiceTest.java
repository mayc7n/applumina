package com.lumina.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import com.lumina.domain.social.entity.Friendship;
import com.lumina.domain.social.repository.FriendshipRepository;
import com.lumina.domain.task.repository.TaskRepository;
import com.lumina.domain.user.entity.User;
import com.lumina.domain.user.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class SocialServiceTest {
    @Mock private FriendshipRepository friendshipRepository;
    @Mock private UserRepository userRepository;
    @Mock private TaskRepository taskRepository;

    private SocialService socialService;
    private UUID userId;
    private User user;
    private User otherUser;

    @BeforeEach
    void setUp() {
        socialService = new SocialService(friendshipRepository, userRepository, taskRepository);
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
    }
}
