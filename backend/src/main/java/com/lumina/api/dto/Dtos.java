package com.lumina.api.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

class TaskMapper {
    static TaskResponse toResponse(com.lumina.domain.task.entity.Task t) {
        return TaskResponse.builder()
            .id(t.getId().toString()).title(t.getTitle())
            .status(t.getStatus().name()).priority(t.getPriority().name())
            .dueDate(t.getDueDate() != null ? t.getDueDate().toString() : null)
            .recurrenceType(t.getRecurrenceType().name())
            .createdAt(t.getCreatedAt().toString())
            .updatedAt(t.getUpdatedAt().toString())
            .build();
    }
}

class HabitMapper {
    static HabitResponse toResponse(com.lumina.domain.habit.entity.Habit h) {
        return HabitResponse.builder()
            .id(h.getId().toString()).name(h.getName())
            .icon(h.getIcon()).color(h.getColor())
            .habitType(h.getHabitType().name()).frequency(h.getFrequency().name())
            .targetValue(h.getTargetValue()).targetUnit(h.getTargetUnit())
            .startDate(h.getStartDate().toString()).orderIndex(h.getOrderIndex())
            .streak(HabitStreakResponse.builder().currentStreak(0).longestStreak(0).totalCompletions(0).build())
            .createdAt(h.getCreatedAt().toString())
            .build();
    }
}
