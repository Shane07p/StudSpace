package com.studspace.course;

import com.studspace.common.ApiResponse;
import com.studspace.course.dto.CourseDto;
import com.studspace.course.dto.CreateCourseRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @GetMapping("/api/semesters/{semId}/courses")
    public ResponseEntity<ApiResponse<List<CourseDto>>> getBySemester(
            @PathVariable UUID semId,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(ApiResponse.ok(courseService.getBySemester(semId, uid(principal))));
    }

    @PostMapping("/api/semesters/{semId}/courses")
    public ResponseEntity<ApiResponse<CourseDto>> create(
            @PathVariable UUID semId,
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody CreateCourseRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(courseService.create(semId, uid(principal), req)));
    }

    @PutMapping("/api/courses/{id}")
    public ResponseEntity<ApiResponse<CourseDto>> update(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody CreateCourseRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(courseService.update(id, uid(principal), req)));
    }

    @DeleteMapping("/api/courses/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal) {
        courseService.delete(id, uid(principal));
        return ResponseEntity.ok(ApiResponse.ok(null, "Course deleted"));
    }

    private UUID uid(UserDetails p) {
        return UUID.fromString(p.getUsername());
    }
}
