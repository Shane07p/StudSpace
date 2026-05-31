package com.studspace.attendance;

import com.studspace.attendance.dto.*;
import com.studspace.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @GetMapping("/api/courses/{courseId}/attendance")
    public ResponseEntity<ApiResponse<AttendanceResponse>> getByCourse(
            @PathVariable UUID courseId,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(ApiResponse.ok(attendanceService.getByCourse(courseId, uid(principal))));
    }

    @PostMapping("/api/courses/{courseId}/attendance")
    public ResponseEntity<ApiResponse<AttendanceResponse>> upsert(
            @PathVariable UUID courseId,
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody UpsertAttendanceRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(attendanceService.upsert(courseId, uid(principal), req)));
    }

    @DeleteMapping("/api/attendance/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal) {
        attendanceService.delete(id, uid(principal));
        return ResponseEntity.ok(ApiResponse.ok(null, "Record deleted"));
    }

    private UUID uid(UserDetails p) {
        return UUID.fromString(p.getUsername());
    }
}
