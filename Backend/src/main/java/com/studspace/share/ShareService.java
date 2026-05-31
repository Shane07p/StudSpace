package com.studspace.share;

import com.studspace.course.Course;
import com.studspace.course.CourseRepository;
import com.studspace.resource.ResourceRepository;
import com.studspace.resource.dto.ResourceDto;
import com.studspace.semester.Semester;
import com.studspace.semester.SemesterService;
import com.studspace.user.User;
import com.studspace.user.UserService;
import com.studspace.user.dto.HandleDto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ShareService {

    private final SemesterService semesterService;
    private final CourseRepository courseRepository;
    private final ResourceRepository resourceRepository;
    private final UserService userService;
    private final ModelMapper mapper;

    public ShareResponse getSharedView(String token) {
        Semester semester = semesterService.findByShareToken(token);
        User user = semester.getUser();

        PublicUser publicUser = new PublicUser(
                user.getFullName(),
                user.getUsername(),
                user.getCollege(),
                user.getBranch(),
                user.getBio(),
                user.getProfilePhoto(),
                userService.toProfileDto(user).getHandles()
        );

        List<Course> courses = courseRepository.findBySemesterIdOrderByCreatedAtAsc(semester.getId());
        List<SharedCourse> sharedCourses = courses.stream().map(c -> {
            List<ResourceDto> resources = resourceRepository.findByCourseIdOrderByCreatedAtDesc(c.getId())
                    .stream()
                    .map(r -> {
                        ResourceDto dto = new ResourceDto();
                        dto.setId(r.getId());
                        dto.setCourseId(r.getCourse().getId());
                        dto.setType(r.getType());
                        dto.setTitle(r.getTitle());
                        dto.setUrl(r.getUrl());
                        dto.setCreatedAt(r.getCreatedAt());
                        return dto;
                    }).toList();
            return new SharedCourse(c.getName(), c.getCode(), resources);
        }).toList();

        SharedSemester sharedSemester = new SharedSemester(semester.getLabel(), sharedCourses);
        return new ShareResponse(publicUser, sharedSemester);
    }

    @Data @AllArgsConstructor
    public static class PublicUser {
        private String fullName;
        private String username;
        private String college;
        private String branch;
        private String bio;
        private String profilePhoto;
        private List<HandleDto> handles;
    }

    @Data @AllArgsConstructor
    public static class SharedCourse {
        private String name;
        private String code;
        private List<ResourceDto> resources;
    }

    @Data @AllArgsConstructor
    public static class SharedSemester {
        private String label;
        private List<SharedCourse> courses;
    }

    @Data @AllArgsConstructor
    public static class ShareResponse {
        private PublicUser user;
        private SharedSemester semester;
    }
}
