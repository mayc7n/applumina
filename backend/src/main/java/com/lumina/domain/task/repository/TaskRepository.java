package com.lumina.domain.task.repository;
import com.lumina.domain.task.entity.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.*;

@Repository
public interface TaskRepository extends JpaRepository<Task,UUID>, JpaSpecificationExecutor<Task> {
    @Query("SELECT t FROM Task t WHERE t.user.id=:uid AND t.deletedAt IS NULL AND t.status NOT IN ('DONE','ARCHIVED','DELETED') AND (t.dueDate=:today OR t.scheduledFor=:today) ORDER BY t.priority DESC, t.orderIndex ASC")
    List<Task> findTodayTasks(@Param("uid") UUID uid, @Param("today") LocalDate today);

    @Query("SELECT t FROM Task t WHERE t.user.id=:uid AND t.deletedAt IS NULL AND t.status NOT IN ('DONE','ARCHIVED','DELETED') AND t.dueDate<:today ORDER BY t.dueDate ASC")
    List<Task> findOverdueTasks(@Param("uid") UUID uid, @Param("today") LocalDate today);

    @Query("SELECT t FROM Task t WHERE t.user.id=:uid AND t.deletedAt IS NULL AND t.inbox=true AND t.status NOT IN ('DONE','ARCHIVED','DELETED') AND t.parentTaskId IS NULL ORDER BY t.createdAt DESC")
    List<Task> findInboxTasks(@Param("uid") UUID uid);

    @Query("SELECT t FROM Task t WHERE t.user.id=:uid AND t.deletedAt IS NULL AND t.dueDate BETWEEN :from AND :to AND t.status NOT IN ('DONE','ARCHIVED','DELETED') ORDER BY t.dueDate ASC")
    List<Task> findUpcomingTasks(@Param("uid") UUID uid, @Param("from") LocalDate from, @Param("to") LocalDate to);

    List<Task> findByParentTaskIdAndDeletedAtIsNull(UUID parentId);
    Optional<Task> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);
    long countByUserIdAndDeletedAtIsNull(UUID userId);
    long countByProjectIdAndDeletedAtIsNull(UUID projectId);
    List<Task> findAllByIdInAndUserId(List<UUID> ids, UUID userId);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.user.id=:uid AND t.status='DONE' AND CAST(t.completedAt AS date)=:date")
    long countCompletedToday(@Param("uid") UUID uid, @Param("date") LocalDate date);

    @Query("SELECT t FROM Task t WHERE t.user.id IN :userIds AND t.status='DONE' AND t.completedAt IS NOT NULL ORDER BY t.completedAt DESC")
    List<Task> findRecentCompletedByUsers(@Param("userIds") List<UUID> userIds, org.springframework.data.domain.Pageable pageable);
}
