package com.lumina.domain.task.repository;
import com.lumina.domain.task.entity.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.*;

@Repository
public interface TaskProjectRepository extends JpaRepository<TaskProject,UUID> {
    List<TaskProject> findByUserIdOrderByOrderIndexAsc(UUID userId);
    Optional<TaskProject> findByIdAndUserId(UUID id, UUID userId);
    boolean existsByNameAndUserId(String name, UUID userId);
    long countByUserId(UUID userId);
}
