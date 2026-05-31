package com.studspace.dashboard;

import com.studspace.attendance.AttendanceRepository;
import com.studspace.attendance.AttendanceStatus;
import com.studspace.course.Course;
import com.studspace.course.CourseRepository;
import com.studspace.course.CourseService;
import com.studspace.course.dto.CourseDto;
import com.studspace.resource.ResourceRepository;
import com.studspace.resource.dto.ResourceDto;
import com.studspace.semester.Semester;
import com.studspace.semester.SemesterRepository;
import com.studspace.semester.dto.SemesterDto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final SemesterRepository semesterRepository;
    private final CourseRepository courseRepository;
    private final AttendanceRepository attendanceRepository;
    private final ResourceRepository resourceRepository;
    private final CourseService courseService;
    private final ModelMapper mapper;

    public DashboardResponse getDashboard(UUID userId) {
        List<Semester> semesters = semesterRepository.findByUserIdOrderByCreatedAtDesc(userId);

        Semester current = semesters.stream().filter(Semester::isCurrent).findFirst()
                .orElse(semesters.isEmpty() ? null : semesters.get(0));

        List<Course> allCourses = courseRepository.findBySemesterUserIdOrderByCreatedAtAsc(userId);
        int totalCourses = allCourses.size();
        int totalResources = allCourses.stream()
                .mapToInt(c -> resourceRepository.countByCourseId(c.getId()))
                .sum();

        double overallAttendance = 0;
        if (!allCourses.isEmpty()) {
            long totalPresent = 0, totalNonCancelled = 0;
            for (Course c : allCourses) {
                var records = attendanceRepository.findByCourseIdOrderByDateAsc(c.getId());
                long present = records.stream().filter(r -> r.getStatus() == AttendanceStatus.PRESENT).count();
                long cancelled = records.stream().filter(r -> r.getStatus() == AttendanceStatus.CANCELLED).count();
                totalPresent += present;
                totalNonCancelled += records.size() - cancelled;
            }
            overallAttendance = totalNonCancelled == 0 ? 0 : (totalPresent * 100.0) / totalNonCancelled;
        }

        int totalCredits = allCourses.stream().mapToInt(Course::getCredits).sum();

        Stats stats = new Stats(totalCourses, Math.round(overallAttendance * 10.0) / 10.0, totalResources, totalCredits);

        CurrentSemesterView currentView = null;
        if (current != null) {
            SemesterDto semDto = mapper.map(current, SemesterDto.class);
            semDto.setShared(current.getShareToken() != null);
            List<CourseDto> courses = courseRepository.findBySemesterIdOrderByCreatedAtAsc(current.getId())
                    .stream().map(courseService::toDto).toList();
            currentView = new CurrentSemesterView(semDto, courses);
        }

        List<ResourceDto> recentResources = resourceRepository
                .findRecentByUserId(userId, PageRequest.of(0, 6))
                .stream()
                .map(r -> {
                    ResourceDto dto = new ResourceDto();
                    dto.setId(r.getId());
                    dto.setCourseId(r.getCourse().getId());
                    dto.setCourseName(r.getCourse().getName());
                    dto.setType(r.getType());
                    dto.setTitle(r.getTitle());
                    dto.setUrl(r.getUrl());
                    dto.setCreatedAt(r.getCreatedAt());
                    return dto;
                })
                .toList();

        return new DashboardResponse(stats, currentView, recentResources);
    }

    @Data
    @AllArgsConstructor
    public static class Stats {
        private int totalCourses;
        private double overallAttendance;
        private int totalResources;
        private int totalCredits;
    }

    @Data
    @AllArgsConstructor
    public static class CurrentSemesterView {
        private SemesterDto semester;
        private List<CourseDto> courses;
    }

    @Data
    @AllArgsConstructor
    public static class DashboardResponse {
        private Stats stats;
        private CurrentSemesterView currentSemester;
        private List<ResourceDto> recentResources;
    }
}
