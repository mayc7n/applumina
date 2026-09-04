package com.lumina.application.service;

import com.lumina.domain.user.entity.DeviceType;
import org.springframework.util.StringUtils;

public record AuthSessionContext(DeviceType deviceType, String deviceName, String userAgent) {
    public static AuthSessionContext web(String deviceName, String userAgent) {
        return new AuthSessionContext(
            DeviceType.WEB,
            StringUtils.hasText(deviceName) ? clean(deviceName, 255) : "Navegador web",
            clean(userAgent, 2_000)
        );
    }

    public static AuthSessionContext mobile(String deviceType, String deviceName, String userAgent) {
        DeviceType parsedType = switch (deviceType == null ? "" : deviceType.trim().toUpperCase()) {
            case "MOBILE_IOS" -> DeviceType.MOBILE_IOS;
            case "MOBILE_ANDROID" -> DeviceType.MOBILE_ANDROID;
            default -> DeviceType.DESKTOP;
        };
        String fallbackName = parsedType == DeviceType.MOBILE_IOS ? "iPhone ou iPad"
            : parsedType == DeviceType.MOBILE_ANDROID ? "Aparelho Android" : "Aparelho móvel";
        return new AuthSessionContext(
            parsedType,
            StringUtils.hasText(deviceName) ? clean(deviceName, 255) : fallbackName,
            clean(userAgent, 2_000)
        );
    }

    public static AuthSessionContext unknown() {
        return new AuthSessionContext(DeviceType.DESKTOP, "Aparelho não identificado", null);
    }

    private static String clean(String value, int maxLength) {
        if (!StringUtils.hasText(value)) return null;
        String cleaned = value.replaceAll("[\\p{Cntrl}&&[^\\t]]", "").trim();
        return cleaned.substring(0, Math.min(cleaned.length(), maxLength));
    }
}
