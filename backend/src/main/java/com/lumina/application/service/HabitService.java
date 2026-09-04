package com.lumina.application.service;

import com.lumina.api.dto.*;
import com.lumina.api.middleware.GlobalExceptionHandler.BusinessException;
import com.lumina.api.middleware.GlobalExceptionHandler.ConflictException;
import com.lumina.api.middleware.GlobalExceptionHandler.ResourceNotFoundException;
import com.lumina.domain.habit.entity.*;
import com.lumina.domain.habit.repository.*;
import com.lumina.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class HabitService {
    private final HabitRepository habitRepository;
    private final HabitCompletionRepository completionRepository;
    private final HabitStreakRepository streakRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<HabitResponse> findAll(UUID userId) {
        return habitRepository.findByUserIdAndArchivedFalseOrderByOrderIndexAsc(userId)
            .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public HabitDetailResponse findById(UUID userId, UUID habitId) {
        Habit habit = getHabit(userId, habitId);
        return HabitDetailResponse.builder()
            .id(habit.getId().toString()).name(habit.getName()).icon(habit.getIcon())
            .color(habit.getColor()).habitType(habit.getHabitType().name())
            .frequency(habit.getFrequency().name()).streak(toStreak(habit.getId()))
            .completions(completionRepository.findByHabitIdOrderByCompletedDateDesc(habitId, 90)
                .stream().map(this::toCompletion).toList())
            .build();
    }

    @Transactional
    public HabitResponse create(UUID userId, CreateHabitRequest request) {
        Habit habit = Habit.builder()
            .user(userRepository.getReferenceById(userId))
            .name(request.name().trim())
            .description(trimToNull(request.description()))
            .icon(StringUtils.hasText(request.icon()) ? request.icon().trim() : "flame")
            .color(StringUtils.hasText(request.color()) ? request.color().trim() : "#6366f1")
            .habitType(parseOptionalEnum(HabitType.class, request.habitType(), HabitType.BUILD, "tipo"))
            .frequency(parseOptionalEnum(HabitFrequency.class, request.frequency(), HabitFrequency.DAILY, "frequência"))
            .frequencyDays(validateDays(request.frequencyDays()))
            .targetValue(validateTarget(request.targetValue()))
            .targetUnit(trimToNull(request.targetUnit()))
            .startDate(parseOptionalDate(request.startDate(), LocalDate.now(), "data inicial"))
            .reminderTime(parseTime(request.reminderTime(), "horário do lembrete"))
            .orderIndex(Math.toIntExact(habitRepository.countByUserIdAndArchivedFalse(userId)))
            .build();
        Habit saved = habitRepository.save(habit);
        streakRepository.save(HabitStreak.builder().habitId(saved.getId()).build());
        return toResponse(saved);
    }

    @Transactional
    public HabitResponse update(UUID userId, UUID habitId, UpdateHabitRequest request) {
        Habit habit = getHabit(userId, habitId);
        if (request.name() != null) {
            if (!StringUtils.hasText(request.name())) throw validation("O nome do hábito não pode ficar vazio");
            habit.setName(request.name().trim());
        }
        if (request.description() != null) habit.setDescription(trimToNull(request.description()));
        if (request.icon() != null) habit.setIcon(trimToNull(request.icon()));
        if (request.color() != null && StringUtils.hasText(request.color())) habit.setColor(request.color().trim());
        if (request.frequency() != null) habit.setFrequency(parseEnum(HabitFrequency.class, request.frequency(), "frequência"));
        if (request.frequencyDays() != null) habit.setFrequencyDays(validateDays(request.frequencyDays()));
        if (request.targetValue() != null) habit.setTargetValue(validateTarget(request.targetValue()));
        if (request.targetUnit() != null) habit.setTargetUnit(trimToNull(request.targetUnit()));
        if (request.startDate() != null) habit.setStartDate(parseDate(request.startDate(), "data inicial"));
        if (request.endDate() != null) habit.setEndDate(parseDate(request.endDate(), "data final"));
        if (request.reminderTime() != null) habit.setReminderTime(parseTime(request.reminderTime(), "horário do lembrete"));
        if (habit.getEndDate() != null && habit.getEndDate().isBefore(habit.getStartDate())) {
            throw validation("A data final deve ser posterior à data inicial");
        }
        return toResponse(habit);
    }

    @Transactional
    public HabitCompletionDto complete(UUID userId, UUID habitId, CompleteHabitRequest request) {
        Habit habit = getHabit(userId, habitId);
        LocalDate today = LocalDate.now();
        if (completionRepository.existsByHabitIdAndCompletedDate(habitId, today)) {
            throw new ConflictException("Este hábito já foi concluído hoje");
        }
        BigDecimal value = request != null && request.value() != null ? request.value() : habit.getTargetValue();
        if (value.compareTo(BigDecimal.ZERO) <= 0) throw validation("O valor concluído deve ser maior que zero");
        HabitCompletion completion = completionRepository.save(HabitCompletion.builder()
            .habit(habit).userId(userId).completedDate(today).value(value)
            .note(request != null ? trimToNull(request.note()) : null).build());
        recomputeStreak(habit);
        return toCompletion(completion);
    }

    @Transactional
    public void uncomplete(UUID userId, UUID habitId, LocalDate date) {
        Habit habit = getHabit(userId, habitId);
        completionRepository.deleteByHabitIdAndCompletedDate(habitId, date != null ? date : LocalDate.now());
        completionRepository.flush();
        recomputeStreak(habit);
    }

    @Transactional
    public void archive(UUID userId, UUID habitId) {
        getHabit(userId, habitId).setArchived(true);
    }

    @Transactional(readOnly = true)
    public List<UUID> todayCompletions(UUID userId) {
        return completionRepository.findHabitIdsByUserIdAndDate(userId, LocalDate.now());
    }

    @Transactional(readOnly = true)
    public List<HabitCompletionDto> completions(UUID userId, UUID habitId, LocalDate from, LocalDate to) {
        getHabit(userId, habitId);
        LocalDate safeTo = to != null ? to : LocalDate.now();
        LocalDate safeFrom = from != null ? from : safeTo.minusDays(29);
        if (safeFrom.isAfter(safeTo)) throw validation("O período de consulta é inválido");
        return completionRepository.findByHabitIdAndCompletedDateBetween(habitId, safeFrom, safeTo)
            .stream().sorted(Comparator.comparing(HabitCompletion::getCompletedDate))
            .map(this::toCompletion).toList();
    }

    @Transactional(readOnly = true)
    public HabitStreakResponse streak(UUID userId, UUID habitId) {
        getHabit(userId, habitId);
        return toStreak(habitId);
    }

    private void recomputeStreak(Habit habit) {
        List<LocalDate> dates = completionRepository.findCompletionDatesByHabitIdOrderByDesc(habit.getId());
        int longest = 0;
        int run = 0;
        LocalDate previous = null;
        List<LocalDate> ascending = new ArrayList<>(new LinkedHashSet<>(dates));
        ascending.sort(Comparator.naturalOrder());
        for (LocalDate date : ascending) {
            if (previous == null || date.equals(previous.plusDays(1))) run++;
            else run = 1;
            longest = Math.max(longest, run);
            previous = date;
        }

        int current = 0;
        if (!dates.isEmpty()) {
            LocalDate cursor = dates.get(0);
            if (!cursor.isBefore(LocalDate.now().minusDays(1))) {
                current = 1;
                for (int index = 1; index < dates.size(); index++) {
                    if (!dates.get(index).equals(cursor.minusDays(1))) break;
                    current++;
                    cursor = dates.get(index);
                }
            }
        }
        HabitStreak streak = streakRepository.findByHabitId(habit.getId())
            .orElseGet(() -> HabitStreak.builder().habitId(habit.getId()).build());
        streak.setCurrentStreak(current);
        streak.setLongestStreak(longest);
        streak.setLastCompleted(dates.isEmpty() ? null : dates.get(0));
        streak.setTotalCompletions(dates.size());
        streakRepository.save(streak);
    }

    private Habit getHabit(UUID userId, UUID habitId) {
        return habitRepository.findByIdAndUserIdAndArchivedFalse(habitId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Hábito não encontrado"));
    }

    private HabitResponse toResponse(Habit habit) {
        return HabitResponse.builder()
            .id(habit.getId().toString()).name(habit.getName()).description(habit.getDescription())
            .icon(habit.getIcon()).color(habit.getColor()).habitType(habit.getHabitType().name())
            .frequency(habit.getFrequency().name()).frequencyDays(habit.getFrequencyDays())
            .targetValue(habit.getTargetValue()).targetUnit(habit.getTargetUnit())
            .startDate(string(habit.getStartDate())).reminderTime(string(habit.getReminderTime()))
            .orderIndex(habit.getOrderIndex()).streak(toStreak(habit.getId()))
            .createdAt(string(habit.getCreatedAt())).build();
    }

    private HabitStreakResponse toStreak(UUID habitId) {
        return streakRepository.findByHabitId(habitId)
            .map(streak -> HabitStreakResponse.builder()
                .currentStreak(streak.getCurrentStreak()).longestStreak(streak.getLongestStreak())
                .lastCompleted(string(streak.getLastCompleted())).totalCompletions(streak.getTotalCompletions()).build())
            .orElseGet(() -> HabitStreakResponse.builder().build());
    }

    private HabitCompletionDto toCompletion(HabitCompletion completion) {
        return HabitCompletionDto.builder().id(completion.getId().toString())
            .completedDate(completion.getCompletedDate().toString()).value(completion.getValue())
            .note(completion.getNote()).build();
    }

    private List<Integer> validateDays(List<Integer> days) {
        if (days == null || days.isEmpty()) return List.of(1, 2, 3, 4, 5, 6, 7);
        if (days.stream().anyMatch(day -> day == null || day < 1 || day > 7)) {
            throw validation("Os dias da frequência devem estar entre 1 e 7");
        }
        return days.stream().distinct().sorted().toList();
    }

    private BigDecimal validateTarget(BigDecimal target) {
        if (target == null) return BigDecimal.ONE;
        if (target.compareTo(BigDecimal.ZERO) <= 0) throw validation("A meta deve ser maior que zero");
        return target;
    }

    private LocalDate parseOptionalDate(String value, LocalDate fallback, String field) {
        return StringUtils.hasText(value) ? parseDate(value, field) : fallback;
    }

    private LocalDate parseDate(String value, String field) {
        try { return LocalDate.parse(value); }
        catch (DateTimeException exception) { throw validation("Valor inválido para " + field); }
    }

    private LocalTime parseTime(String value, String field) {
        if (!StringUtils.hasText(value)) return null;
        try { return LocalTime.parse(value); }
        catch (DateTimeException exception) { throw validation("Valor inválido para " + field); }
    }

    private <E extends Enum<E>> E parseOptionalEnum(Class<E> type, String value, E fallback, String field) {
        return StringUtils.hasText(value) ? parseEnum(type, value, field) : fallback;
    }

    private <E extends Enum<E>> E parseEnum(Class<E> type, String value, String field) {
        try { return Enum.valueOf(type, value.trim().toUpperCase(Locale.ROOT)); }
        catch (IllegalArgumentException exception) { throw validation("Valor inválido para " + field); }
    }

    private BusinessException validation(String message) {
        return new BusinessException("VALIDATION_ERROR", message, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String string(Object value) {
        return value != null ? value.toString() : null;
    }
}
