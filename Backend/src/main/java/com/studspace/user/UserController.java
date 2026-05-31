package com.studspace.user;

import com.studspace.common.ApiResponse;
import com.studspace.user.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/api/user/me")
    public ResponseEntity<ApiResponse<UserProfileDto>> getMe(@AuthenticationPrincipal UserDetails principal) {
        UUID userId = UUID.fromString(principal.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(userService.getProfile(userId)));
    }

    @PutMapping("/api/user/me")
    public ResponseEntity<ApiResponse<UserProfileDto>> updateMe(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody UpdateProfileRequest req) {
        UUID userId = UUID.fromString(principal.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(userService.updateProfile(userId, req)));
    }

    @PutMapping("/api/user/me/handles")
    public ResponseEntity<ApiResponse<List<HandleDto>>> updateHandles(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody UpdateHandlesRequest req) {
        UUID userId = UUID.fromString(principal.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(userService.updateHandles(userId, req.getHandles())));
    }

    @PostMapping("/api/user/me/photo")
    public ResponseEntity<ApiResponse<UserProfileDto>> updatePhoto(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody PhotoRequest req) {
        UUID userId = UUID.fromString(principal.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(userService.updatePhoto(userId, req.getPhoto())));
    }

    @PostMapping("/api/user/me/cover")
    public ResponseEntity<ApiResponse<UserProfileDto>> updateCover(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody PhotoRequest req) {
        UUID userId = UUID.fromString(principal.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(userService.updateCover(userId, req.getPhoto())));
    }

    @PutMapping("/api/user/me/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody ChangePasswordRequest req) {
        UUID userId = UUID.fromString(principal.getUsername());
        userService.changePassword(userId, req.getCurrentPassword(), req.getNewPassword());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @DeleteMapping("/api/user/me")
    public ResponseEntity<ApiResponse<Void>> deleteAccount(
            @AuthenticationPrincipal UserDetails principal) {
        UUID userId = UUID.fromString(principal.getUsername());
        userService.deleteAccount(userId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

}
