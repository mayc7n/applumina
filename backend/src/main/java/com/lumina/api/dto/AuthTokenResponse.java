package com.lumina.api.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Builder;

@Builder
public record AuthTokenResponse(
    @JsonIgnore String accessToken,
    @JsonIgnore String refreshToken,
    Integer expiresIn,
    Boolean requiresTwoFactor,
    String tempToken
) {}
