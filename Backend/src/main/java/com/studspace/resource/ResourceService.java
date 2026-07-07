package com.studspace.resource;

import com.studspace.common.ForbiddenException;
import com.studspace.common.NotFoundException;
import com.studspace.course.Course;
import com.studspace.course.CourseService;
import com.studspace.resource.dto.CreateResourceRequest;
import com.studspace.resource.dto.ResourceDto;
import com.studspace.semester.Semester;
import com.studspace.semester.SemesterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResourceService {

    private final ResourceRepository resourceRepository;
    private final CourseService courseService;
    private final SemesterRepository semesterRepository;

    public List<ResourceDto> getByCourse(UUID courseId, UUID userId) {
        courseService.getOwned(courseId, userId);
        return resourceRepository.findByCourseIdOrderByCreatedAtDesc(courseId)
                .stream().map(this::toDto).toList();
    }

    public ResourceDto getOne(UUID resourceId, UUID userId) {
        return toDto(getOwned(resourceId, userId));
    }

    public List<ResourceDto> getUncategorized(UUID semId, UUID userId) {
        getSemesterOwned(semId, userId);
        return resourceRepository.findBySemesterIdAndCourseIsNullOrderByCreatedAtDesc(semId)
                .stream().map(this::toDto).toList();
    }

    @Transactional
    public ResourceDto create(UUID courseId, UUID userId, CreateResourceRequest req) {
        Course course = courseService.getOwned(courseId, userId);
        Resource resource = Resource.builder()
                .course(course)
                .semester(course.getSemester())
                .type(req.getType())
                .title(req.getTitle())
                .url(req.getUrl())
                .notes(req.getNotes())
                .build();
        return toDto(resourceRepository.save(resource));
    }

    @Transactional
    public ResourceDto createForSemester(UUID semId, UUID userId, CreateResourceRequest req) {
        Semester sem = getSemesterOwned(semId, userId);
        Resource resource = Resource.builder()
                .semester(sem)
                .course(null)
                .type(req.getType())
                .title(req.getTitle())
                .url(req.getUrl())
                .notes(req.getNotes())
                .build();
        return toDto(resourceRepository.save(resource));
    }

    @Transactional
    public ResourceDto update(UUID resourceId, UUID userId, CreateResourceRequest req) {
        Resource resource = getOwned(resourceId, userId);
        if (req.getType() != null) resource.setType(req.getType());
        if (req.getTitle() != null) resource.setTitle(req.getTitle());
        if (req.getUrl() != null) resource.setUrl(req.getUrl());
        if (req.getNotes() != null) resource.setNotes(req.getNotes());
        return toDto(resourceRepository.save(resource));
    }

    @Transactional
    public void delete(UUID resourceId, UUID userId) {
        getOwned(resourceId, userId);
        resourceRepository.deleteById(resourceId);
    }

    private Resource getOwned(UUID resourceId, UUID userId) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new NotFoundException("Resource not found"));
        UUID ownerUserId = resource.getCourse() != null
                ? resource.getCourse().getSemester().getUser().getId()
                : resource.getSemester().getUser().getId();
        if (!ownerUserId.equals(userId)) throw new ForbiddenException("Access denied");
        return resource;
    }

    private Semester getSemesterOwned(UUID semId, UUID userId) {
        Semester sem = semesterRepository.findById(semId)
                .orElseThrow(() -> new NotFoundException("Semester not found"));
        if (!sem.getUser().getId().equals(userId)) throw new ForbiddenException("Access denied");
        return sem;
    }

    public ResourceDto toDto(Resource r) {
        ResourceDto dto = new ResourceDto();
        dto.setId(r.getId());
        dto.setType(r.getType());
        dto.setTitle(r.getTitle());
        dto.setUrl(r.getUrl());
        dto.setNotes(r.getNotes());
        dto.setCreatedAt(r.getCreatedAt());
        if (r.getCourse() != null) {
            dto.setCourseId(r.getCourse().getId());
            dto.setCourseName(r.getCourse().getName());
        }
        return dto;
    }
}
