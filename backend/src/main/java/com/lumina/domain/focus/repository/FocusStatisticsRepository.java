package com.lumina.domain.focus.repository;
import com.lumina.domain.focus.entity.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.*;
import java.util.*;

@Repository
public interface FocusStatisticsRepository extends JpaRepository<FocusStatistics,UUID> {
    Optional<FocusStatistics> findByUserId(UUID userId);
}
