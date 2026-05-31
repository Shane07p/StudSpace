package com.studspace.course;

import com.studspace.attendance.AttendanceRecord;
import com.studspace.attendance.AttendanceRepository;
import com.studspace.attendance.AttendanceStatus;
import com.studspace.common.ForbiddenException;
import com.studspace.common.NotFoundException;
import com.studspace.course.dto.CourseDto;
import com.studspace.course.dto.CreateCourseRequest;
import com.studspace.resource.ResourceRepository;
import com.studspace.semester.Semester;
import com.studspace.semester.SemesterService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final SemesterService semesterService;
    private final AttendanceRepository attendanceRepository;
    private final ResourceRepository resourceRepository;

    public List<CourseDto> getBySemester(UUID semesterId, UUID userId) {
        Semester semester = semesterService.getOwned(semesterId, userId);
        List<Course> courses = courseRepository.findBySemesterIdOrderByCreatedAtAsc(semester.getId());
        if (courses.isEmpty()) return List.of();

        List<UUID> courseIds = courses.stream().map(Course::getId).toList();

        Map<UUID, List<AttendanceRecord>> recordsMap = attendanceRepository
                .findByCourseIdIn(courseIds)
                .stream()
                .collect(Collectors.groupingBy(r -> r.getCourse().getId()));

        Map<UUID, Integer> countMap = resourceRepository
                .countByCourseIds(courseIds)
                .stream()
                .collect(Collectors.toMap(
                        row -> (UUID) row[0],
                        row -> ((Long) row[1]).intValue()
                ));

        return courses.stream()
                .map(c -> toDto(c, recordsMap.getOrDefault(c.getId(), List.of()), countMap.getOrDefault(c.getId(), 0)))
                .toList();
    }

    @Transactional
    public CourseDto create(UUID semesterId, UUID userId, CreateCourseRequest req) {
        Semester semester = semesterService.getOwned(semesterId, userId);
        Course course = Course.builder()
                .semester(semester)
                .code(req.getCode())
                .name(req.getName())
                .instructor(req.getInstructor())
                .credits(req.getCredits() != null ? req.getCredits() : 3)
                .build();
        return toDto(courseRepository.save(course));
    }

    @Transactional
    public CourseDto update(UUID courseId, UUID userId, CreateCourseRequest req) {
        Course course = getOwned(courseId, userId);
        if (req.getCode() != null) course.setCode(req.getCode());
        if (req.getName() != null) course.setName(req.getName());
        if (req.getInstructor() != null) course.setInstructor(req.getInstructor());
        if (req.getCredits() != null) course.setCredits(req.getCredits());
        return toDto(courseRepository.save(course));
    }

    @Transactional
    public void delete(UUID courseId, UUID userId) {
        Course course = getOwned(courseId, userId);
        courseRepository.delete(course);
    }

    public Course getOwned(UUID courseId, UUID userId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new NotFoundException("Course not found"));
        if (!course.getSemester().getUser().getId().equals(userId)) {
            throw new ForbiddenException("Access denied");
        }
        return course;
    }

    public CourseDto toDto(Course c) {
        var records = attendanceRepository.findByCourseIdOrderByDateAsc(c.getId());
        int resourceCount = resourceRepository.countByCourseId(c.getId());
        return toDto(c, records, resourceCount);
    }

    public CourseDto toDto(Course c, List<AttendanceRecord> records, int resourceCount) {
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

        CourseDto dto = new CourseDto();
        dto.setId(c.getId());
        dto.setSemesterId(c.getSemester().getId());
        dto.setCode(c.getCode());
        dto.setName(c.getName());
        dto.setInstructor(c.getInstructor());
        dto.setCredits(c.getCredits());
        dto.setTotalClasses(total);
        dto.setPresentCount(present);
        dto.setAbsentCount(absent);
        dto.setCancelledCount(cancelled);
        dto.setAttendancePercentage(Math.round(pct * 10.0) / 10.0);
        dto.setClassesNeededFor75(Math.max(0, needed));
        dto.setResourceCount(resourceCount);
        return dto;
    }
}
