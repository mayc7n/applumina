package com.lumina.application.service;

import com.lumina.api.dto.UserResponse;
import com.lumina.api.dto.UserPreferencesResponse;
import com.lumina.api.dto.UpdatePreferencesRequest;
import com.lumina.api.dto.UpdateProfileRequest;
import com.lumina.api.middleware.GlobalExceptionHandler.BusinessException;
import com.lumina.api.middleware.GlobalExceptionHandler.ConflictException;
import com.lumina.api.middleware.GlobalExceptionHandler.ResourceNotFoundException;
import com.lumina.domain.user.entity.User;
import com.lumina.domain.user.entity.UserPreferences;
import com.lumina.domain.user.repository.UserRepository;
import com.lumina.domain.user.repository.UserPreferencesRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.DateTimeException;
import java.time.ZoneId;
import java.util.*;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final UserPreferencesRepository preferencesRepository;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(UUID userId) {
        return UserResponse.from(getUser(userId));
    }

    @Transactional
    public UserResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = getUser(userId);
        if (request.displayName() != null) {
            String displayName = request.displayName();
            if (!StringUtils.hasText(displayName)) throw validation("Nome de exibição inválido");
            user.setDisplayName(displayName.trim());
        }
        if (request.username() != null) {
            String username = request.username();
            String normalized = username.trim().toLowerCase(Locale.ROOT);
            userRepository.findByUsernameAndDeletedAtIsNull(normalized)
                .filter(existing -> !existing.getId().equals(userId))
                .ifPresent(existing -> { throw new ConflictException("Este username já está em uso"); });
            user.setUsername(normalized);
        }
        if (request.bio() != null) user.setBio(trimToNull(request.bio()));
        if (request.timezone() != null) {
            try { user.setTimezone(ZoneId.of(request.timezone().trim()).getId()); }
            catch (DateTimeException exception) { throw validation("Fuso horário inválido"); }
        }
        if (request.locale() != null) user.setLocale(request.locale());
        return UserResponse.from(user);
    }

    @Transactional(readOnly = true)
    public UserPreferencesResponse getPreferences(UUID userId) {
        getUser(userId);
        return toPreferences(preferencesRepository.findById(userId)
            .orElseGet(() -> UserPreferences.builder().userId(userId).build()));
    }

    @Transactional
    public UserPreferencesResponse updatePreferences(UUID userId, UpdatePreferencesRequest request) {
        getUser(userId);
        UserPreferences preferences = preferencesRepository.findById(userId)
            .orElseGet(() -> UserPreferences.builder().userId(userId).build());
        if (request.theme() != null) preferences.setTheme(request.theme());
        if (request.accentColor() != null) preferences.setAccentColor(request.accentColor());
        if (request.weekStartsOn() != null) preferences.setWeekStartsOn(request.weekStartsOn());
        if (request.dailyGoalHours() != null) preferences.setDailyGoalHours(request.dailyGoalHours());
        if (request.notificationSettings() != null) preferences.setNotificationSettings(request.notificationSettings());
        if (request.focusSettings() != null) preferences.setFocusSettings(request.focusSettings());
        if (request.privacySettings() != null) preferences.setPrivacySettings(request.privacySettings());
        if (request.dashboardLayout() != null) preferences.setDashboardLayout(request.dashboardLayout());
        return toPreferences(preferencesRepository.save(preferences));
    }

    @Transactional(readOnly = true)
    public byte[] exportData(UUID userId) {
        User user = getUser(userId);
        Map<String, Object> export = new LinkedHashMap<>();
        export.put("exportedAt", java.time.Instant.now());
        export.put("profile", UserResponse.from(user));
        export.put("preferences", getPreferences(userId));
        List<String> tables = List.of(
            "tasks", "task_projects", "labels", "habits", "habit_completions",
            "goals", "goal_check_ins", "journal_entries", "books", "book_reading_logs",
            "focus_sessions", "study_subjects", "study_sessions"
        );
        for (String table : tables) {
            export.put(table, jdbcTemplate.queryForList("SELECT * FROM " + table + " WHERE user_id = ?", userId));
        }
        try { return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(export); }
        catch (Exception exception) { throw new IllegalStateException("Falha ao exportar dados", exception); }
    }

    @Transactional
    public void deleteAccount(UUID userId, String confirmation) {
        User user = getUser(userId);
        if (!user.getEmail().equalsIgnoreCase(confirmation)) {
            throw validation("Confirmação de e-mail inválida");
        }
        user.softDelete();
    }

    private User getUser(UUID userId) {
        return userRepository.findActiveById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
    }

    private UserPreferencesResponse toPreferences(UserPreferences preferences) {
        return new UserPreferencesResponse(
            preferences.getTheme(), preferences.getAccentColor(), preferences.getWeekStartsOn(),
            preferences.getDailyGoalHours(), preferences.getNotificationSettings(),
            preferences.getFocusSettings(), preferences.getPrivacySettings(), preferences.getDashboardLayout());
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private BusinessException validation(String message) {
        return new BusinessException("VALIDATION_ERROR", message, HttpStatus.UNPROCESSABLE_ENTITY);
    }
}
