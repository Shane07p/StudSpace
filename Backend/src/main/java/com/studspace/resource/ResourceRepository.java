package com.studspace.resource;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, UUID> {
    List<Resource> findByCourseIdOrderByCreatedAtDesc(UUID courseId);
    int countByCourseId(UUID courseId);

    @Query("SELECT r.course.id, COUNT(r) FROM Resource r WHERE r.course.id IN :ids GROUP BY r.course.id")
    List<Object[]> countByCourseIds(@Param("ids") Collection<UUID> ids);

    List<Resource> findBySemesterIdAndCourseIsNullOrderByCreatedAtDesc(UUID semesterId);

    @Query("SELECT r FROM Resource r WHERE r.course.semester.user.id = :userId ORDER BY r.createdAt DESC")
    List<Resource> findRecentByUserId(UUID userId, org.springframework.data.domain.Pageable pageable);
}
