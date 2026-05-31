package com.studspace.slot;

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
        Course course = req.getCourseId() != null
                ? courseRepository.findById(req.getCourseId()).orElse(null) : null;
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
        Course course = req.getCourseId() != null
                ? courseRepository.findById(req.getCourseId()).orElse(null) : null;
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
