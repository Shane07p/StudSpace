package com.studspace.slot;

import com.studspace.common.BadRequestException;
import com.studspace.common.ForbiddenException;
import com.studspace.common.NotFoundException;
import com.studspace.course.Course;
import com.studspace.course.CourseRepository;
import com.studspace.semester.Semester;
import com.studspace.semester.SemesterRepository;
import com.studspace.slot.dto.CreateSlotRequest;
import com.studspace.slot.dto.TimetableSlotDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TimetableSlotService {

    private final TimetableSlotRepository slotRepository;
    private final SemesterRepository semesterRepository;
    private final CourseRepository courseRepository;

    public List<TimetableSlotDto> getBySemester(UUID semId, UUID userId) {
        Semester sem = getSemesterOwned(semId, userId);
        return slotRepository.findBySemesterIdOrderByDayAscStartTimeAsc(sem.getId())
                .stream().map(this::toDto).toList();
    }

    @Transactional
    public TimetableSlotDto create(UUID semId, UUID userId, CreateSlotRequest req) {
        Semester sem = getSemesterOwned(semId, userId);
        Course course = resolveCourse(req.getCourseId(), sem);
        assertNoOverlap(sem, req.getDay(), req.getStart(), req.getEnd(), null);
        TimetableSlot slot = TimetableSlot.builder()
                .semester(sem)
                .course(course)
                .day(req.getDay())
                .startTime(req.getStart())
                .endTime(req.getEnd())
                .room(req.getRoom())
                .build();
        return toDto(slotRepository.save(slot));
    }

    @Transactional
    public TimetableSlotDto update(UUID slotId, UUID userId, CreateSlotRequest req) {
        TimetableSlot slot = getSlotOwned(slotId, userId);
        Course course = resolveCourse(req.getCourseId(), slot.getSemester());
        assertNoOverlap(slot.getSemester(), req.getDay(), req.getStart(), req.getEnd(), slot.getId());
        slot.setDay(req.getDay());
        slot.setStartTime(req.getStart());
        slot.setEndTime(req.getEnd());
        slot.setRoom(req.getRoom());
        slot.setCourse(course);
        return toDto(slotRepository.save(slot));
    }

    @Transactional
    public void delete(UUID slotId, UUID userId) {
        getSlotOwned(slotId, userId);
        slotRepository.deleteById(slotId);
    }

    // A slot's course must belong to the same semester, otherwise a user could attach
    // one of their courses from an unrelated semester by passing its id directly.
    private Course resolveCourse(UUID courseId, Semester sem) {
        if (courseId == null) return null;
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new NotFoundException("Course not found"));
        if (!course.getSemester().getId().equals(sem.getId())) {
            throw new BadRequestException("Course does not belong to this semester");
        }
        return course;
    }

    // Reject a slot whose time range intersects an existing slot on the same day in this semester
    // (also blocks exact duplicates). Times are zero-padded "HH:MM", so string comparison is chronological.
    private void assertNoOverlap(Semester sem, String day, String start, String end, UUID excludeSlotId) {
        boolean overlaps = slotRepository.findBySemesterIdAndDay(sem.getId(), day).stream()
                .filter(s -> excludeSlotId == null || !s.getId().equals(excludeSlotId))
                .anyMatch(s -> s.getStartTime().compareTo(end) < 0 && start.compareTo(s.getEndTime()) < 0);
        if (overlaps) {
            throw new BadRequestException("This time overlaps an existing class on " + day + ".");
        }
    }

    private Semester getSemesterOwned(UUID semId, UUID userId) {
        Semester sem = semesterRepository.findById(semId)
                .orElseThrow(() -> new NotFoundException("Semester not found"));
        if (!sem.getUser().getId().equals(userId)) throw new ForbiddenException("Access denied");
        return sem;
    }

    private TimetableSlot getSlotOwned(UUID slotId, UUID userId) {
        TimetableSlot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new NotFoundException("Slot not found"));
        if (!slot.getSemester().getUser().getId().equals(userId))
            throw new ForbiddenException("Access denied");
        return slot;
    }

    private TimetableSlotDto toDto(TimetableSlot s) {
        TimetableSlotDto dto = new TimetableSlotDto();
        dto.setId(s.getId());
        dto.setDay(s.getDay());
        dto.setStart(s.getStartTime());
        dto.setEnd(s.getEndTime());
        dto.setRoom(s.getRoom());
        if (s.getCourse() != null) {
            dto.setCourseId(s.getCourse().getId());
            dto.setCourseCode(s.getCourse().getCode());
            dto.setCourseName(s.getCourse().getName());
        }
        return dto;
    }
}
