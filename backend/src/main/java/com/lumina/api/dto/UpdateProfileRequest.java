package com.lumina.api.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
    @Size(min = 2, max = 100) String displayName,
    @Pattern(regexp = "^[a-z0-9_]{3,50}$") String username,
    @Size(max = 500) String bio,
    @Size(max = 100) String timezone,
    @Pattern(regexp = "^[a-z]{2}(?:-[A-Z]{2})?$") String locale
) {}
