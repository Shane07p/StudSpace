package com.studspace.semester;

import com.studspace.common.ApiResponse;
import com.studspace.semester.dto.CreateSemesterRequest;
import com.studspace.semester.dto.SemesterDto;
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
@RequestMapping("/api/semesters")
@RequiredArgsConstructor
public class SemesterController {

    private final SemesterService semesterService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SemesterDto>>> getAll(@AuthenticationPrincipal UserDetails principal) {
        UUID userId = uid(principal);
        return ResponseEntity.ok(ApiResponse.ok(semesterService.getAll(userId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SemesterDto>> create(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody CreateSemesterRequest req) {
        UUID userId = uid(principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(semesterService.create(userId, req)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SemesterDto>> update(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody CreateSemesterRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(semesterService.update(id, uid(principal), req)));
    }

    @PostMapping("/{id}/current")
    public ResponseEntity<ApiResponse<SemesterDto>> setCurrent(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(ApiResponse.ok(semesterService.setAsCurrent(id, uid(principal))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal) {
        semesterService.delete(id, uid(principal));
        return ResponseEntity.ok(ApiResponse.ok(null, "Semester deleted"));
    }

    @PostMapping("/{id}/share")
    public ResponseEntity<ApiResponse<SemesterDto>> enableShare(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(ApiResponse.ok(semesterService.enableSharing(id, uid(principal))));
    }

    @DeleteMapping("/{id}/share")
    public ResponseEntity<ApiResponse<Void>> disableShare(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal) {
        semesterService.disableSharing(id, uid(principal));
        return ResponseEntity.ok(ApiResponse.ok(null, "Sharing disabled"));
    }

    private UUID uid(UserDetails p) {
        return UUID.fromString(p.getUsername());
    }
}
