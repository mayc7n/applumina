package com.lumina.domain.focus.repository;
import com.lumina.domain.focus.entity.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.*;
import java.util.*;

@Repository
public interface FocusSessionRepository extends JpaRepository<FocusSession,UUID> {
    Optional<FocusSession> findByIdAndUserId(UUID id, UUID userId);
    @Query("SELECT s FROM FocusSession s WHERE s.user.id=:uid AND s.status='ACTIVE'")
    Optional<FocusSession> findActiveByUserId(@Param("uid") UUID uid);
    @Query("SELECT s FROM FocusSession s WHERE s.user.id=:uid AND s.startedAt BETWEEN :from AND :to ORDER BY s.startedAt DESC")
    List<FocusSession> findByUserIdAndPeriod(@Param("uid") UUID uid,@Param("from") Instant from,@Param("to") Instant to);
    @Query("SELECT COALESCE(SUM(s.actualMins),0) FROM FocusSession s WHERE s.user.id=:uid AND s.status='COMPLETED' AND s.startedAt BETWEEN :from AND :to")
    int sumFocusMinsByUserAndPeriod(@Param("uid") UUID uid,@Param("from") Instant from,@Param("to") Instant to);
}
