package com.lumina.api.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record ChangePasswordRequest(
    @NotBlank @Size(max = 128) String currentPassword,
    @NotBlank @Size(min = 8, max = 128) String newPassword
) {}
