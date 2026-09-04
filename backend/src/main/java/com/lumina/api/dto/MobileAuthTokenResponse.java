package com.lumina.api.dto;

public record MobileAuthTokenResponse(
    String accessToken,
    String refreshToken,
    Integer expiresIn,
    Boolean requiresTwoFactor,
    String tempToken
) {
    public static MobileAuthTokenResponse from(AuthTokenResponse response) {
        return new MobileAuthTokenResponse(
            response.accessToken(),
            response.refreshToken(),
            response.expiresIn(),
            response.requiresTwoFactor(),
            response.tempToken()
        );
    }
}
