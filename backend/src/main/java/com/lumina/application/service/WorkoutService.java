package com.lumina.application.service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.lumina.api.dto.CreateWorkoutRequest;
import com.lumina.api.dto.WorkoutResponse;
import com.lumina.api.middleware.GlobalExceptionHandler.BusinessException;
import com.lumina.domain.user.repository.UserRepository;
import com.lumina.domain.workout.entity.Workout;
import com.lumina.domain.workout.entity.WorkoutPrivacy;
import com.lumina.domain.workout.entity.WorkoutType;
import com.lumina.domain.workout.repository.WorkoutRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class WorkoutService {
    private static final int MAX_RECENT_WORKOUTS = 100;

    private final WorkoutRepository workoutRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<WorkoutResponse> list(UUID userId) {
        return workoutRepository.findByUserIdOrderByActivityDateDescCreatedAtDesc(
            userId,
            PageRequest.of(0, MAX_RECENT_WORKOUTS)
        ).stream().map(this::toResponse).toList();
    }

    @Transactional
    public WorkoutResponse create(UUID userId, CreateWorkoutRequest request) {
        String customActivity = normalizeCustomActivity(request.type(), request.customActivity());
        Workout workout = workoutRepository.save(Workout.builder()
            .user(userRepository.getReferenceById(userId))
            .type(request.type())
            .customActivity(customActivity)
            .activityDate(request.activityDate())
            .durationMins(request.durationMins())
            .notes(trimToNull(request.notes()))
            .privacy(WorkoutPrivacy.PRIVATE)
            .build());
        return toResponse(workout);
    }

    private String normalizeCustomActivity(WorkoutType type, String value) {
        if (type != WorkoutType.CUSTOM) return null;
        if (!StringUtils.hasText(value) || value.trim().length() < 2) {
            throw validation("Informe o nome da atividade personalizada");
        }
        return value.trim();
    }

    private WorkoutResponse toResponse(Workout workout) {
        return new WorkoutResponse(
            workout.getId().toString(),
            workout.getType().name(),
            workout.getCustomActivity(),
            workout.getActivityDate().toString(),
            workout.getDurationMins(),
            workout.getNotes(),
            workout.getPrivacy().name(),
            string(workout.getCreatedAt())
        );
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String string(Instant value) {
        return value != null ? value.toString() : null;
    }

    private BusinessException validation(String message) {
        return new BusinessException("VALIDATION_ERROR", message, HttpStatus.UNPROCESSABLE_ENTITY);
    }
}
