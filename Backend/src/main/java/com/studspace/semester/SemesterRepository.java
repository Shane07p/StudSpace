package com.studspace.semester;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SemesterRepository extends JpaRepository<Semester, UUID> {
    List<Semester> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<Semester> findByShareToken(String shareToken);
    @Modifying
    @Query(value = "UPDATE semesters SET is_current = false WHERE user_id = :userId", nativeQuery = true)
    void clearCurrentForUser(@org.springframework.data.repository.query.Param("userId") UUID userId);
}
