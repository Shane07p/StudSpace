package com.studspace.resource;

import com.studspace.common.ApiResponse;
import com.studspace.resource.dto.CreateResourceRequest;
import com.studspace.resource.dto.ResourceDto;
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
public class ResourceController {

    private final ResourceService resourceService;

    @GetMapping("/api/semesters/{semId}/resources")
    public ResponseEntity<ApiResponse<List<ResourceDto>>> getUncategorized(
            @PathVariable UUID semId,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(ApiResponse.ok(resourceService.getUncategorized(semId, uid(principal))));
    }

    @PostMapping("/api/semesters/{semId}/resources")
    public ResponseEntity<ApiResponse<ResourceDto>> createForSemester(
            @PathVariable UUID semId,
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody CreateResourceRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(resourceService.createForSemester(semId, uid(principal), req)));
    }

    @GetMapping("/api/courses/{courseId}/resources")
    public ResponseEntity<ApiResponse<List<ResourceDto>>> getByCourse(
            @PathVariable UUID courseId,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(ApiResponse.ok(resourceService.getByCourse(courseId, uid(principal))));
    }

    @PostMapping("/api/courses/{courseId}/resources")
    public ResponseEntity<ApiResponse<ResourceDto>> create(
            @PathVariable UUID courseId,
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody CreateResourceRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(resourceService.create(courseId, uid(principal), req)));
    }

    @PutMapping("/api/resources/{id}")
    public ResponseEntity<ApiResponse<ResourceDto>> update(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody CreateResourceRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(resourceService.update(id, uid(principal), req)));
    }

    @DeleteMapping("/api/resources/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal) {
        resourceService.delete(id, uid(principal));
        return ResponseEntity.ok(ApiResponse.ok(null, "Resource deleted"));
    }

    private UUID uid(UserDetails p) {
        return UUID.fromString(p.getUsername());
    }
}
