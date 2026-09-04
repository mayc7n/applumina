package com.lumina.domain.habit.repository;
import com.lumina.domain.habit.entity.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.*;

@Repository
public interface HabitRepository extends JpaRepository<Habit,UUID> {
    List<Habit> findByUserIdAndArchivedFalseOrderByOrderIndexAsc(UUID userId);
    Optional<Habit> findByIdAndUserIdAndArchivedFalse(UUID id, UUID userId);
    long countByUserIdAndArchivedFalse(UUID userId);
}
