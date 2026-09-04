package com.lumina.domain.journal.repository;
import com.lumina.domain.journal.entity.JournalEntry;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository
public interface JournalRepository extends JpaRepository<JournalEntry,UUID> {
    @Query("SELECT e FROM JournalEntry e WHERE e.user.id=:uid ORDER BY e.pinned DESC, e.entryDate DESC")
    List<JournalEntry> findByUserIdOrderByPinnedDescDateDesc(@Param("uid") UUID uid);
    Optional<JournalEntry> findByIdAndUserId(UUID id, UUID userId);
    long countByUserId(UUID userId);
}
