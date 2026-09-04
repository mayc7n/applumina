package com.lumina.infrastructure.security;
import lombok.*;
import java.util.UUID;

@Getter @Builder @AllArgsConstructor
public class UserPrincipal {
    private final UUID userId;
    private final String email;
    private final String role;
    public boolean isAdmin() { return "ADMIN".equals(role) || "SUPER_ADMIN".equals(role); }
    public boolean isPro()   { return "PRO".equals(role) || "TEAM".equals(role) || "ENTERPRISE".equals(role); }
}
