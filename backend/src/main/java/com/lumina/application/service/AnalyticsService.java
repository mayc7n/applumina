package com.lumina.application.service;

import com.lumina.api.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AnalyticsService {
    private final JdbcTemplate jdbcTemplate;

    @Transactional(readOnly = true)
    public WeeklyAnalyticsDto weekly(UUID userId, LocalDate from) {
        LocalDate start = from != null ? from : LocalDate.now().minusDays(6);
        LocalDate end = start.plusDays(6);
        int habitsTotal = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM habits WHERE user_id=? AND is_archived=false", Integer.class, userId);

        List<DailyDataPointDto> daily = new ArrayList<>();
        List<MoodTrendDto> moodTrend = new ArrayList<>();
        int totalTasks = 0;
        int totalFocus = 0;
        int totalHabitRate = 0;
        for (int index = 0; index < 7; index++) {
            LocalDate date = start.plusDays(index);
            int tasks = count("SELECT COUNT(*) FROM tasks WHERE user_id=? AND status='DONE' AND completed_at::date=?", userId, date);
            int habits = count("SELECT COUNT(*) FROM habit_completions WHERE user_id=? AND completed_date=?", userId, date);
            int focus = count("SELECT COALESCE(SUM(actual_mins),0) FROM focus_sessions WHERE user_id=? AND status='COMPLETED' AND started_at::date=?", userId, date);
            int rate = habitsTotal > 0 ? Math.min(100, habits * 100 / habitsTotal) : 0;
            double score = Math.min(100, tasks * 15 + rate * .45 + Math.min(30, focus / 2.0));
            daily.add(DailyDataPointDto.builder().date(date.toString()).tasksCompleted(tasks)
                .habitRate(rate).focusMins(focus).productivityScore(Math.round(score * 10) / 10.0).build());
            totalTasks += tasks;
            totalFocus += focus;
            totalHabitRate += rate;

            Integer mood = jdbcTemplate.query(
                "SELECT mood::text FROM journal_entries WHERE user_id=? AND entry_date=? AND mood IS NOT NULL ORDER BY created_at DESC LIMIT 1",
                result -> result.next() ? moodValue(result.getString(1)) : null, userId, date);
            if (mood != null) moodTrend.add(new MoodTrendDto(date.toString(), mood));
        }

        List<DayOfWeekDataDto> tasksByDay = daily.stream()
            .map(day -> new DayOfWeekDataDto(LocalDate.parse(day.date()).getDayOfWeek().name(), day.tasksCompleted()))
            .toList();
        List<FocusDistributionDto> distribution = jdbcTemplate.query(
            "SELECT mode::text, COALESCE(SUM(actual_mins),0) FROM focus_sessions WHERE user_id=? AND status='COMPLETED' AND started_at::date BETWEEN ? AND ? GROUP BY mode ORDER BY 2 DESC",
            (result, row) -> new FocusDistributionDto(result.getString(1), result.getInt(2)), userId, start, end);
        int habitRate = totalHabitRate / 7;
        int productivity = (int) Math.round(daily.stream().mapToDouble(DailyDataPointDto::productivityScore).average().orElse(0));
        int studyMins = count("SELECT COALESCE(SUM(duration_mins),0) FROM study_sessions WHERE user_id=? AND session_date BETWEEN ? AND ?", userId, start, end);
        int pages = count("SELECT COALESCE(SUM(pages_read),0) FROM book_reading_logs WHERE user_id=? AND logged_at BETWEEN ? AND ?", userId, start, end);
        int streak = calculateStreak(daily);

        List<AreaBalanceDto> balance = List.of(
            new AreaBalanceDto("Tarefas", Math.min(100, totalTasks * 12)),
            new AreaBalanceDto("Hábitos", habitRate),
            new AreaBalanceDto("Foco", Math.min(100, totalFocus / 3)),
            new AreaBalanceDto("Estudos", Math.min(100, studyMins / 3)),
            new AreaBalanceDto("Leitura", Math.min(100, pages))
        );
        List<InsightDto> insights = buildInsights(totalTasks, habitRate, totalFocus, productivity);

        return WeeklyAnalyticsDto.builder()
            .daily(daily).tasksByDayOfWeek(tasksByDay).focusDistribution(distribution)
            .moodTrend(moodTrend).areaBalance(balance).productivityScore(productivity)
            .tasksCompleted(totalTasks).habitRate(habitRate).focusMins(totalFocus).streak(streak)
            .insights(insights).trends(Map.of()).build();
    }

    private int count(String sql, Object... params) {
        Integer value = jdbcTemplate.queryForObject(sql, Integer.class, params);
        return value != null ? value : 0;
    }

    private int moodValue(String mood) {
        return switch (mood) {
            case "TERRIBLE" -> 1; case "BAD" -> 2; case "NEUTRAL" -> 3;
            case "GOOD" -> 4; case "EXCELLENT" -> 5; default -> 0;
        };
    }

    private int calculateStreak(List<DailyDataPointDto> daily) {
        int streak = 0;
        for (int index = daily.size() - 1; index >= 0; index--) {
            DailyDataPointDto day = daily.get(index);
            if (day.tasksCompleted() == 0 && day.habitRate() == 0 && day.focusMins() == 0) break;
            streak++;
        }
        return streak;
    }

    private List<InsightDto> buildInsights(int tasks, int habitRate, int focus, int score) {
        List<InsightDto> insights = new ArrayList<>();
        if (score >= 70) insights.add(new InsightDto("trending-up", "Semana consistente", "Seu índice geral de produtividade está acima de 70.", "success"));
        if (habitRate < 50) insights.add(new InsightDto("flame", "Hábitos precisam de atenção", "Sua taxa média ficou abaixo de 50%. Reduza o número de hábitos ou simplifique as metas.", "warning"));
        if (focus < 120) insights.add(new InsightDto("timer", "Reserve blocos de foco", "Tente acumular ao menos duas horas de foco profundo na semana.", "info"));
        if (tasks == 0) insights.add(new InsightDto("check-square", "Planeje entregas menores", "Nenhuma tarefa foi concluída neste período.", "info"));
        return insights;
    }
}
