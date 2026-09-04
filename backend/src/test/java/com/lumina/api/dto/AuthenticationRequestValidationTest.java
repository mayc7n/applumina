package com.lumina.api.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AuthenticationRequestValidationTest {
    private static AutoCloseable validatorFactory;
    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        var factory = Validation.buildDefaultValidatorFactory();
        validatorFactory = factory;
        validator = factory.getValidator();
    }

    @AfterAll
    static void closeValidator() throws Exception {
        validatorFactory.close();
    }

    @Test
    void rejectsMalformedLoginInput() {
        var violations = validator.validate(new LoginRequest("invalid-email", ""));

        assertThat(violations).extracting(violation -> violation.getPropertyPath().toString())
            .containsExactlyInAnyOrder("email", "password");
    }

    @Test
    void rejectsUsernameOutsidePublicContract() {
        var request = new RegisterRequest(
            "user@example.com",
            "Invalid Username",
            "User Example",
            "strong-password"
        );

        assertThat(validator.validate(request)).extracting(violation -> violation.getPropertyPath().toString())
            .contains("username");
    }

    @Test
    void limitsRefreshTokenRequestSize() {
        var request = new RefreshTokenRequest("x".repeat(4_097));

        assertThat(validator.validate(request)).extracting(violation -> violation.getPropertyPath().toString())
            .contains("refreshToken");
    }
}
