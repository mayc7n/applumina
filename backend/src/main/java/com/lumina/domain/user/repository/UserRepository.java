package com.lumina.domain.user.repository;
import com.lumina.domain.user.entity.User;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User,UUID> {
    Optional<User> findByEmailAndDeletedAtIsNull(String email);
    Optional<User> findByUsernameAndDeletedAtIsNull(String username);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    @Query("SELECT u FROM User u WHERE u.id=:id AND u.deletedAt IS NULL AND u.status='ACTIVE'")
    Optional<User> findActiveById(@Param("id") UUID id);
    @Query("""
        SELECT u FROM User u
        WHERE u.deletedAt IS NULL AND u.status='ACTIVE' AND u.id<>:uid
          AND NOT EXISTS (SELECT b.id FROM UserBlock b
              WHERE (b.blockerId=:uid AND b.blockedId=u.id)
                 OR (b.blockerId=u.id AND b.blockedId=:uid))
          AND (LOWER(u.displayName) LIKE LOWER(CONCAT('%',:query,'%'))
            OR LOWER(u.username) LIKE LOWER(CONCAT('%',:query,'%')))
        ORDER BY u.displayName, u.id
        """)
    List<User> searchActiveUsers(@Param("uid") UUID userId, @Param("query") String query, org.springframework.data.domain.Pageable pageable);
}
