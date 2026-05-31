package com.studspace.slot;

import com.studspace.common.ApiResponse;
import com.studspace.slot.dto.CreateSlotRequest;
import com.studspace.slot.dto.TimetableSlotDto;
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
public class TimetableSlotController {

    private final TimetableSlotService slotService;

    @GetMapping("/api/semesters/{semId}/slots")
    public ResponseEntity<ApiResponse<List<TimetableSlotDto>>> list(
            @PathVariable UUID semId,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(ApiResponse.ok(slotService.getBySemester(semId, uid(principal))));
    }

    @PostMapping("/api/semesters/{semId}/slots")
    public ResponseEntity<ApiResponse<TimetableSlotDto>> create(
            @PathVariable UUID semId,
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody CreateSlotRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(slotService.create(semId, uid(principal), req)));
    }

    @PutMapping("/api/slots/{id}")
    public ResponseEntity<ApiResponse<TimetableSlotDto>> update(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody CreateSlotRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(slotService.update(id, uid(principal), req)));
    }

    @DeleteMapping("/api/slots/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal) {
        slotService.delete(id, uid(principal));
        return ResponseEntity.ok(ApiResponse.ok(null, "Slot deleted"));
    }

    private UUID uid(UserDetails p) {
        return UUID.fromString(p.getUsername());
    }
}
