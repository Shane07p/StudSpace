package com.studspace.attendance;

import com.studspace.attendance.dto.*;
import com.studspace.common.ForbiddenException;
import com.studspace.common.NotFoundException;
import com.studspace.course.Course;
import com.studspace.course.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final CourseService courseService;

    public AttendanceResponse getByCourse(UUID courseId, UUID userId) {
        courseService.getOwned(courseId, userId);
        List<AttendanceRecord> records = attendanceRepository.findByCourseIdOrderByDateAsc(courseId);
        return buildResponse(records);
    }

    @Transactional
    public AttendanceResponse upsert(UUID courseId, UUID userId, UpsertAttendanceRequest req) {
        Course course = courseService.getOwned(courseId, userId);
        AttendanceRecord record = attendanceRepository
                .findByCourseIdAndDate(courseId, req.getDate())
                .orElseGet(() -> AttendanceRecord.builder().course(course).date(req.getDate()).build());
        record.setStatus(req.getStatus());
        attendanceRepository.save(record);
        List<AttendanceRecord> records = attendanceRepository.findByCourseIdOrderByDateAsc(courseId);
        return buildResponse(records);
    }

    @Transactional
    public void delete(UUID recordId, UUID userId) {
        getOwned(recordId, userId);
        attendanceRepository.deleteById(recordId);
    }

    private AttendanceRecord getOwned(UUID recordId, UUID userId) {
        AttendanceRecord record = attendanceRepository.findById(recordId)
                .orElseThrow(() -> new NotFoundException("Attendance record not found"));
        if (!record.getCourse().getSemester().getUser().getId().equals(userId)) {
            throw new ForbiddenException("Access denied");
        }
        return record;
    }

    private AttendanceResponse buildResponse(List<AttendanceRecord> records) {
        int present = (int) records.stream().filter(r -> r.getStatus() == AttendanceStatus.PRESENT).count();
        int absent = (int) records.stream().filter(r -> r.getStatus() == AttendanceStatus.ABSENT).count();
        int cancelled = (int) records.stream().filter(r -> r.getStatus() == AttendanceStatus.CANCELLED).count();
        int total = records.size();
        int nonCancelled = total - cancelled;

        double pct = nonCancelled == 0 ? 0.0 : (present * 100.0) / nonCancelled;
        int needed = 0;
        if (pct < 75 && nonCancelled > 0) {
            needed = (int) Math.ceil((0.75 * nonCancelled - present) / 0.25);
        }

        AttendanceSummaryDto summary = new AttendanceSummaryDto(
                present, absent, cancelled, total,
                Math.round(pct * 10.0) / 10.0,
                Math.max(0, needed)
        );

        List<AttendanceDto> dtos = records.stream().map(this::toDto).toList();
        return new AttendanceResponse(dtos, summary);
    }

    private AttendanceDto toDto(AttendanceRecord r) {
        AttendanceDto dto = new AttendanceDto();
        dto.setId(r.getId());
        dto.setCourseId(r.getCourse().getId());
        dto.setDate(r.getDate());
        dto.setStatus(r.getStatus());
        return dto;
    }
}
