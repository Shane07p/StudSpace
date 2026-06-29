package com.studspace.auth;

import com.studspace.auth.dto.AuthResponse;
import com.studspace.auth.dto.LoginRequest;
import com.studspace.auth.dto.RegisterRequest;
import com.studspace.common.ApiResponse;
import com.studspace.common.ClientIp;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(authService.register(req), "Account created successfully"));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest req,
                                                           HttpServletRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(authService.login(req, ClientIp.from(request))));
    }
}
