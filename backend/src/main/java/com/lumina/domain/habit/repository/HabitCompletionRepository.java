package com.lumina.domain.habit.repository;
import com.lumina.domain.habit.entity.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.*;

@Repository
public interface HabitCompletionRepository extends JpaRepository<HabitCompletion,UUID> {
    boolean existsByHabitIdAndCompletedDate(UUID habitId, LocalDate date);
    void deleteByHabitIdAndCompletedDate(UUID habitId, LocalDate date);
    List<HabitCompletion> findByHabitIdAndCompletedDateBetween(UUID habitId, LocalDate from, LocalDate to);
    @Query("SELECT c.completedDate FROM HabitCompletion c WHERE c.habit.id=:id ORDER BY c.completedDate DESC")
    List<LocalDate> findCompletionDatesByHabitIdOrderByDesc(@Param("id") UUID habitId);
    @Query("SELECT c.habit.id FROM HabitCompletion c WHERE c.userId=:uid AND c.completedDate=:date")
    List<UUID> findHabitIdsByUserIdAndDate(@Param("uid") UUID uid, @Param("date") LocalDate date);
    @Query("SELECT c FROM HabitCompletion c WHERE c.habit.id=:id ORDER BY c.completedDate DESC")
    List<HabitCompletion> findByHabitIdOrderByCompletedDateDesc(@Param("id") UUID habitId, Pageable pageable);
    default List<HabitCompletion> findByHabitIdOrderByCompletedDateDesc(UUID habitId, int limit) {
        return findByHabitIdOrderByCompletedDateDesc(habitId, PageRequest.of(0,limit));
    }
}
