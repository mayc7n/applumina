package com.lumina.api.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record CreateUserReportRequest(
    @NotNull UUID userId,
    @NotNull @Pattern(regexp = "HARASSMENT|SPAM|HATE|IMPERSONATION|INAPPROPRIATE_CONTENT|OTHER") String category,
    @Size(max = 1000) String details
) {
    public enum Category {
        HARASSMENT, SPAM, HATE, IMPERSONATION, INAPPROPRIATE_CONTENT, OTHER
    }

    @Override
    public String toString() {
        return "CreateUserReportRequest[details=REDACTED]";
    }
}
