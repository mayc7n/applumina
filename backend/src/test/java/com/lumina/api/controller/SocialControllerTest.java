package com.lumina.api.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.lumina.application.service.SocialService;
import com.lumina.infrastructure.security.UserPrincipal;
import com.lumina.api.middleware.GlobalExceptionHandler;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.core.MethodParameter;
import org.springframework.web.method.support.ModelAndViewContainer;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.http.MediaType;

@ExtendWith(MockitoExtension.class)
class SocialControllerTest {
    @Mock private SocialService socialService;

    private SocialController controller;
    private MockMvc mvc;
    private final UUID actorId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        controller = new SocialController(socialService);
        mvc = MockMvcBuilders.standaloneSetup(controller)
            .setControllerAdvice(new GlobalExceptionHandler())
            .setCustomArgumentResolvers(new HandlerMethodArgumentResolver() {
                public boolean supportsParameter(MethodParameter parameter) {
                    return parameter.getParameterType() == UserPrincipal.class;
                }
                public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer container,
                    NativeWebRequest request, WebDataBinderFactory factory) {
                    return UserPrincipal.builder().userId(actorId).build();
                }
            }).build();
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

    @Test
    void blockAndUnblockReturnNoContentAndUseAuthenticatedActor() throws Exception {
        UUID target = UUID.randomUUID();
        mvc.perform(post("/social/blocks").contentType(MediaType.APPLICATION_JSON)
                .content("{\"userId\":\"" + target + "\"}"))
            .andExpect(status().isNoContent()).andExpect(content().string(""));
        mvc.perform(delete("/social/blocks/{userId}", target))
            .andExpect(status().isNoContent()).andExpect(content().string(""));
        verify(socialService).block(actorId, target);
        verify(socialService).unblock(actorId, target);
    }

    @Test
    void listsOnlyBlocksOwnedByAuthenticatedActor() throws Exception {
        mvc.perform(get("/social/blocks")).andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
        verify(socialService).blockedUsers(actorId);
    }

    @Test
    void reportReturnsCreatedWithoutPrivateDetails() throws Exception {
        UUID target = UUID.randomUUID();
        mvc.perform(post("/social/reports").contentType(MediaType.APPLICATION_JSON)
                .content("{\"userId\":\"" + target + "\",\"category\":\"SPAM\",\"details\":\"private evidence\"}"))
            .andExpect(status().isCreated()).andExpect(content().string(""));
        verify(socialService).report(actorId,
            new com.lumina.api.dto.CreateUserReportRequest(target, "SPAM", "private evidence"));
    }

    @Test
    void rejectsInvalidReportsWithoutEchoingEvidence() throws Exception {
        UUID target = UUID.randomUUID();
        for (String body : java.util.List.of(
            "{\"userId\":\"" + target + "\",\"category\":\"UNKNOWN\",\"details\":\"private evidence\"}",
            "{\"userId\":\"" + target + "\",\"category\":\"SPAM\",\"details\":\"" + "x".repeat(1001) + "\"}",
            "{\"category\":\"SPAM\"}", "{\"userId\":\"" + target + "\"}")) {
            mvc.perform(post("/social/reports").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("private evidence"))));
        }
        verifyNoInteractions(socialService);
    }

    @Test
    void rejectsMissingBlockTarget() throws Exception {
        mvc.perform(post("/social/blocks").contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isUnprocessableEntity());
        verifyNoInteractions(socialService);
    }
}
