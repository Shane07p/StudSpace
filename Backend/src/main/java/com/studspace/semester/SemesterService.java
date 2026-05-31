package com.studspace.semester;

import com.studspace.common.ForbiddenException;
import com.studspace.common.NotFoundException;
import com.studspace.semester.dto.CreateSemesterRequest;
import com.studspace.semester.dto.SemesterDto;
import com.studspace.user.User;
import com.studspace.user.UserService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SemesterService {

    private final SemesterRepository semesterRepository;
    private final UserService userService;
    private final ModelMapper mapper;

    public List<SemesterDto> getAll(UUID userId) {
        return semesterRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toDto).toList();
    }

    @Transactional
    public SemesterDto create(UUID userId, CreateSemesterRequest req) {
        User user = userService.findById(userId);
        Semester semester = Semester.builder()
                .user(user)
                .label(req.getLabel())
                .shortName(req.getShortName())
                .current(req.isCurrent())
                .build();
        return toDto(semesterRepository.save(semester));
    }

    @Transactional
    public SemesterDto update(UUID semesterId, UUID userId, CreateSemesterRequest req) {
        Semester semester = getOwned(semesterId, userId);
        if (req.getLabel() != null) semester.setLabel(req.getLabel());
        if (req.getShortName() != null) semester.setShortName(req.getShortName());
        semester.setCurrent(req.isCurrent());
        return toDto(semesterRepository.save(semester));
    }

    @Transactional
    public SemesterDto setAsCurrent(UUID semesterId, UUID userId) {
        Semester semester = getOwned(semesterId, userId);
        semesterRepository.clearCurrentForUser(userId);
        semester.setCurrent(true);
        return toDto(semesterRepository.save(semester));
    }

    @Transactional
    public void delete(UUID semesterId, UUID userId) {
        Semester semester = getOwned(semesterId, userId);
        semesterRepository.delete(semester);
    }

    @Transactional
    public SemesterDto enableSharing(UUID semesterId, UUID userId) {
        Semester semester = getOwned(semesterId, userId);
        if (semester.getShareToken() == null) {
            String token = UUID.randomUUID().toString().replace("-", "");
            semester.setShareToken(token);
            semesterRepository.save(semester);
        }
        return toDto(semester);
    }

    @Transactional
    public void disableSharing(UUID semesterId, UUID userId) {
        Semester semester = getOwned(semesterId, userId);
        semester.setShareToken(null);
        semesterRepository.save(semester);
    }

    public Semester getOwned(UUID semesterId, UUID userId) {
        Semester semester = semesterRepository.findById(semesterId)
                .orElseThrow(() -> new NotFoundException("Semester not found"));
        if (!semester.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Access denied");
        }
        return semester;
    }

    public Semester findByShareToken(String token) {
        return semesterRepository.findByShareToken(token)
                .orElseThrow(() -> new NotFoundException("Shared semester not found"));
    }

    private SemesterDto toDto(Semester s) {
        SemesterDto dto = mapper.map(s, SemesterDto.class);
        dto.setShared(s.getShareToken() != null);
        return dto;
    }
}
