package com.lumina.api.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record RegisterRequest(
    @NotBlank @Email String email,
    @NotBlank @Size(min = 3, max = 50) @Pattern(regexp = "^[a-z0-9_]+$") String username,
    @NotBlank @Size(min = 2, max = 100) String displayName,
    @NotBlank @Size(min = 8, max = 128) String password
) {}
