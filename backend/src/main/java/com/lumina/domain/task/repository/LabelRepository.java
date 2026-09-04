package com.lumina.domain.task.repository;
import com.lumina.domain.task.entity.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.*;

@Repository
public interface LabelRepository extends JpaRepository<Label,UUID> {
    List<Label> findByUserId(UUID userId);
    boolean existsByNameAndUserId(String name, UUID userId);
    List<Label> findAllByIdInAndUserId(List<UUID> ids, UUID userId);
}
