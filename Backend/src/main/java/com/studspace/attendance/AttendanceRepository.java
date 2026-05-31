package com.studspace.attendance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AttendanceRepository extends JpaRepository<AttendanceRecord, UUID> {
    List<AttendanceRecord> findByCourseIdOrderByDateAsc(UUID courseId);
    List<AttendanceRecord> findByCourseIdIn(Collection<UUID> courseIds);
    Optional<AttendanceRecord> findByCourseIdAndDate(UUID courseId, LocalDate date);
}
