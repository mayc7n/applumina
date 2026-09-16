package com.lumina.application.service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.lumina.api.dto.CreateWorkoutRequest;
import com.lumina.api.dto.UpdateWorkoutRequest;
import com.lumina.api.dto.WorkoutResponse;
import com.lumina.api.dto.WorkoutCalendarDayResponse;
import com.lumina.api.middleware.GlobalExceptionHandler.BusinessException;
import com.lumina.api.middleware.GlobalExceptionHandler.ResourceNotFoundException;
import com.lumina.domain.user.repository.UserRepository;
import com.lumina.domain.workout.entity.Workout;
import com.lumina.domain.workout.entity.WorkoutMedia;
import com.lumina.domain.workout.entity.WorkoutMediaStatus;
import com.lumina.domain.workout.entity.WorkoutPrivacy;
import com.lumina.domain.workout.entity.WorkoutType;
import com.lumina.domain.workout.repository.WorkoutRepository;
import com.lumina.domain.workout.repository.WorkoutMediaRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class WorkoutService {
    private static final int MAX_RECENT_WORKOUTS = 100;

    private final WorkoutRepository workoutRepository;
    private final UserRepository userRepository;
    private final WorkoutMediaRepository workoutMediaRepository;

    @Transactional(readOnly = true)
    public List<WorkoutResponse> list(UUID userId) {
        return workoutRepository.findByUserIdOrderByActivityDateDescCreatedAtDesc(
            userId,
            PageRequest.of(0, MAX_RECENT_WORKOUTS)
        ).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<WorkoutCalendarDayResponse> calendar(UUID userId, LocalDate from, LocalDate to) {
        if (from == null || to == null || from.isAfter(to)) {
            throw validation("O período do calendário é inválido");
        }
        var workouts = workoutRepository
            .findByUserIdAndActivityDateBetweenOrderByActivityDateAscCreatedAtAsc(userId, from, to)
            ;
        var workoutIds = workouts.stream().map(Workout::getId).toList();
        Map<UUID, WorkoutMedia> mediaByWorkout = workoutIds.isEmpty()
            ? Map.of()
            : workoutMediaRepository.findByWorkoutIdInAndUserId(workoutIds, userId).stream()
                .filter(media -> media.getStatus() == WorkoutMediaStatus.READY)
                .filter(media -> media.getContentType().startsWith("image/"))
                .collect(Collectors.toMap(
                    media -> media.getWorkout().getId(),
                    media -> media,
                    (first, ignored) -> first,
                    LinkedHashMap::new
                ));
        return workouts.stream()
            .collect(Collectors.groupingBy(
                Workout::getActivityDate,
                LinkedHashMap::new,
                Collectors.toList()
            ))
            .entrySet()
            .stream()
            .map(entry -> toCalendarDay(entry.getKey(), entry.getValue(), mediaByWorkout))
            .toList();
    }

    @Transactional(readOnly = true)
    public WorkoutResponse findById(UUID userId, UUID workoutId) {
        return toResponse(getWorkout(userId, workoutId));
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
            .privacy(request.privacy() == null ? WorkoutPrivacy.PRIVATE : request.privacy())
            .build());
        return toResponse(workout);
    }

    @Transactional
    public WorkoutResponse update(UUID userId, UUID workoutId, UpdateWorkoutRequest request) {
        Workout workout = getWorkout(userId, workoutId);
        workout.setType(request.type());
        workout.setCustomActivity(normalizeCustomActivity(request.type(), request.customActivity()));
        workout.setActivityDate(request.activityDate());
        workout.setDurationMins(request.durationMins());
        workout.setNotes(trimToNull(request.notes()));
        if (request.privacy() != null) workout.setPrivacy(request.privacy());
        return toResponse(workout);
    }

    @Transactional
    public void delete(UUID userId, UUID workoutId) {
        workoutRepository.delete(getWorkout(userId, workoutId));
    }

    private Workout getWorkout(UUID userId, UUID workoutId) {
        return workoutRepository.findByIdAndUserId(workoutId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Treino não encontrado"));
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

    private WorkoutCalendarDayResponse toCalendarDay(
        LocalDate date,
        List<Workout> workouts,
        Map<UUID, WorkoutMedia> mediaByWorkout
    ) {
        return new WorkoutCalendarDayResponse(
            date.toString(),
            workouts.size(),
            workouts.stream().mapToInt(Workout::getDurationMins).sum(),
            workouts.stream().anyMatch(workout -> mediaByWorkout.containsKey(workout.getId())),
            workouts.stream().map(workout -> new WorkoutCalendarDayResponse.WorkoutSummary(
                workout.getId().toString(),
                workout.getType().name(),
                workout.getCustomActivity(),
                workout.getDurationMins(),
                mediaByWorkout.containsKey(workout.getId())
                    ? "/workouts/" + workout.getId() + "/moment"
                    : null
            )).toList()
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
