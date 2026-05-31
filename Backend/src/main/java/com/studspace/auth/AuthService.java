package com.studspace.auth;

import com.studspace.auth.dto.AuthResponse;
import com.studspace.auth.dto.LoginRequest;
import com.studspace.auth.dto.RegisterRequest;
import com.studspace.user.User;
import com.studspace.user.UserService;
import com.studspace.user.dto.UserProfileDto;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public AuthResponse register(RegisterRequest req) {
        User user = userService.register(req.getFullName(), req.getUsername(), req.getEmail(), req.getPassword());
        String token = jwtUtil.generateToken(user.getId());
        UserProfileDto profile = userService.toProfileDto(user);
        return new AuthResponse(token, profile);
    }

    public AuthResponse login(LoginRequest req) {
        User user = userService.findByUsername(req.getUsername());
        if (user.getPasswordHash() == null || user.getPasswordHash().isEmpty()) {
            throw new BadCredentialsException("This account uses Google sign-in. Please use 'Continue with Google'.");
        }
        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }
        String token = jwtUtil.generateToken(user.getId());
        UserProfileDto profile = userService.toProfileDto(user);
        return new AuthResponse(token, profile);
    }
}
