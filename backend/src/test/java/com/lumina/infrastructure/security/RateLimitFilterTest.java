package com.lumina.infrastructure.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class RateLimitFilterTest {
    @Test
    void limitsPasswordRecoveryAfterFiveRequestsEvenWithForgedForwardedAddresses() throws Exception {
        RateLimitFilter filter = new RateLimitFilter(new ObjectMapper().registerModule(new JavaTimeModule()));
        ReflectionTestUtils.setField(filter, "enabled", true);

        MockHttpServletResponse response = null;
        for (int attempt = 1; attempt <= 6; attempt++) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/auth/forgot-password");
            request.setServletPath("/auth/forgot-password");
            request.setRemoteAddr("198.51.100.10");
            request.addHeader("X-Forwarded-For", "203.0.113." + attempt);
            response = new MockHttpServletResponse();
            filter.doFilter(request, response, mock(FilterChain.class));
        }

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(429);
        assertThat(response.getHeader("Retry-After")).isEqualTo("900");
    }
}
