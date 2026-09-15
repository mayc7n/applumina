package com.lumina.application.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lumina.api.middleware.GlobalExceptionHandler.BusinessException;
import com.lumina.domain.social.repository.UserBlockRepository;
import com.lumina.domain.user.repository.UserRepository;
import com.lumina.domain.workout.repository.WorkoutMediaRepository;
import com.lumina.domain.workout.repository.WorkoutRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service @RequiredArgsConstructor
public class WorkoutPostService {
    private final JdbcTemplate jdbc;
    private final WorkoutRepository workouts;
    private final WorkoutMediaRepository media;
    private final UserRepository users;
    private final ObjectMapper mapper;

    @Transactional
    public String publish(UUID userId, UUID workoutId, String privacy, String caption) {
        if (!Set.of("FRIENDS", "PUBLIC").contains(privacy)) throw new BusinessException("INVALID_PRIVACY", "Escolha amigos ou público", HttpStatus.UNPROCESSABLE_ENTITY);
        var workout = workouts.findByIdAndUserId(workoutId, userId).orElseThrow(() -> new BusinessException("WORKOUT_NOT_FOUND", "Treino não encontrado", HttpStatus.NOT_FOUND));
        var moment = media.findByWorkoutIdAndUserId(workoutId, userId).orElse(null);
        try {
            String content = mapper.writeValueAsString(Map.of("workoutId", workoutId.toString(), "activityDate", workout.getActivityDate().toString(), "durationMins", workout.getDurationMins(), "caption", caption == null ? "" : caption.trim(), "mediaId", moment == null ? "" : moment.getId().toString()));
            return jdbc.queryForObject("INSERT INTO social_posts(user_id,type,content,privacy) VALUES (?, 'WORKOUT', ?::jsonb, ?::social_privacy) RETURNING id", String.class, userId, content, privacy);
        } catch (Exception e) { throw new BusinessException("POST_FAILED", "Não foi possível publicar o treino", HttpStatus.SERVICE_UNAVAILABLE); }
    }
}
