package com.lumina.domain.analytics.repository;
import com.lumina.domain.analytics.entity.DailySnapshot;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.*;

@Repository
public interface DailySnapshotRepository extends JpaRepository<DailySnapshot,UUID> {
    List<DailySnapshot> findByUserIdAndSnapshotDateBetweenOrderBySnapshotDateAsc(UUID uid, LocalDate from, LocalDate to);
    boolean existsByUserIdAndSnapshotDate(UUID uid, LocalDate date);
    @Query("SELECT s.snapshotDate FROM DailySnapshot s WHERE s.userId=:uid AND (s.tasksCompleted>0 OR s.habitsCompleted>0 OR s.focusMins>0) ORDER BY s.snapshotDate DESC")
    List<LocalDate> findActiveDaysByUserId(@Param("uid") UUID uid);
    @Modifying @Query("UPDATE DailySnapshot s SET s.tasksCompleted=s.tasksCompleted+1 WHERE s.userId=:uid AND s.snapshotDate=:date")
    void incrementTasksCompleted(@Param("uid") UUID uid, @Param("date") LocalDate date);
}
