package com.lumina.application.service;

import com.lumina.api.dto.*;
import com.lumina.domain.task.entity.Task;
import com.lumina.domain.task.repository.TaskRepository;
import com.lumina.domain.goal.entity.GoalStatus;
import com.lumina.domain.journal.repository.JournalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class DashboardService {
    private final TaskRepository taskRepository;
    private final HabitService habitService;
    private final GoalService goalService;
    private final FocusService focusService;
    private final AnalyticsService analyticsService;
    private final JournalRepository journalRepository;

    @Transactional(readOnly = true)
    public DashboardDataDto getDashboard(UUID userId) {
        LocalDate today = LocalDate.now();
        List<TaskResponse> todayTasks = taskRepository.findTodayTasks(userId, today)
            .stream()
            .map(this::toTaskResponse)
            .toList();

        List<HabitResponse> habits = habitService.findAll(userId);
        List<String> todayCompletions = habitService.todayCompletions(userId).stream().map(UUID::toString).toList();
        List<GoalResponse> goals = goalService.findAll(userId, GoalStatus.ACTIVE.name());
        FocusStatsResponse focus = focusService.stats(userId);
        WeeklyAnalyticsDto analytics = analyticsService.weekly(userId, today.minusDays(6));
        List<WeeklyDataPointDto> weeklyData = analytics.daily().stream()
            .map(day -> WeeklyDataPointDto.builder().date(day.date()).tasksCompleted(day.tasksCompleted())
                .habitRate(day.habitRate()).focusMins(day.focusMins())
                .productivityScore(day.productivityScore()).build()).toList();
        int currentStreak = habits.stream().map(HabitResponse::streak).filter(Objects::nonNull)
            .mapToInt(HabitStreakResponse::currentStreak).max().orElse(0);
        int longestStreak = habits.stream().map(HabitResponse::streak).filter(Objects::nonNull)
            .mapToInt(HabitStreakResponse::longestStreak).max().orElse(0);
        List<ActivityItemDto> activity = taskRepository.findRecentCompletedByUsers(List.of(userId), org.springframework.data.domain.PageRequest.of(0, 5))
            .stream().map(task -> new ActivityItemDto(task.getId().toString(), "task_completed",
                "Concluiu " + task.getTitle(), "check-square", task.getCompletedAt().toString())).toList();
        boolean moodChecked = journalRepository.findByUserIdOrderByPinnedDescDateDesc(userId).stream()
            .anyMatch(entry -> entry.getEntryDate().equals(today) && entry.getMood() != null);

        return DashboardDataDto.builder()
            .todayTasks(todayTasks)
            .habits(habits)
            .todayCompletions(todayCompletions)
            .activeGoals(goals)
            .focusStats(FocusStatsDto.builder().weeklyMins(focus.weeklyMins()).build())
            .streak(currentStreak)
            .longestStreak(longestStreak)
            .weeklyData(weeklyData)
            .recentActivity(activity)
            .moodCheckedIn(moodChecked)
            .build();
    }

    private TaskResponse toTaskResponse(Task task) {
        return TaskResponse.builder()
            .id(task.getId().toString())
            .title(task.getTitle())
            .description(task.getDescription())
            .status(task.getStatus().name())
            .priority(task.getPriority().name())
            .dueDate(task.getDueDate() != null ? task.getDueDate().toString() : null)
            .scheduledFor(task.getScheduledFor() != null ? task.getScheduledFor().toString() : null)
            .estimatedMins(task.getEstimatedMins())
            .projectId(task.getProjectId() != null ? task.getProjectId().toString() : null)
            .recurrenceType(task.getRecurrenceType().name())
            .completedAt(task.getCompletedAt() != null ? task.getCompletedAt().toString() : null)
            .createdAt(task.getCreatedAt().toString())
            .updatedAt(task.getUpdatedAt().toString())
            .build();
    }
}
