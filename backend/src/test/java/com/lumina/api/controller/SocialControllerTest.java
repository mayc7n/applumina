package com.lumina.api.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.lumina.application.service.SocialService;
import com.lumina.infrastructure.security.UserPrincipal;

@ExtendWith(MockitoExtension.class)
class SocialControllerTest {
    @Mock private SocialService socialService;

    private SocialController controller;

    @BeforeEach
    void setUp() {
        controller = new SocialController(socialService);
    }

    @Test
    void returnsApiEnvelopeAfterAcceptingRequest() {
        UUID userId = UUID.randomUUID();
        UUID requestId = UUID.randomUUID();
        UserPrincipal principal = UserPrincipal.builder().userId(userId).build();

        var response = controller.accept(principal, requestId);

        verify(socialService).accept(userId, requestId);
        assertThat(response.success()).isTrue();
    }
}
