package com.studspace.auth;

import com.studspace.auth.dto.AuthResponse;
import com.studspace.auth.dto.LoginRequest;
import com.studspace.auth.dto.RegisterRequest;
import com.studspace.common.TooManyRequestsException;
import com.studspace.user.User;
import com.studspace.user.UserService;
import com.studspace.user.dto.UserProfileDto;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    // Per-IP failed-login counter (5 / 15 min). A successful login clears the IP's entry,
    // so only wrong-password attempts count toward the limit.
    private final Map<String, Bucket> loginFailures = new ConcurrentHashMap<>();

    public AuthResponse register(RegisterRequest req) {
        User user = userService.register(req.getFullName(), req.getUsername(), req.getEmail(), req.getPassword());
        String token = jwtUtil.generateToken(user.getId());
        UserProfileDto profile = userService.toProfileDto(user);
        return new AuthResponse(token, profile);
    }

    public AuthResponse login(LoginRequest req, String clientIp) {
        Bucket failures = loginFailures.computeIfAbsent(clientIp, k -> newFailureBucket());
        if (failures.getAvailableTokens() <= 0) {
            throw new TooManyRequestsException("Too many failed login attempts. Please wait 15 minutes and try again.");
        }

        User user;
        try {
            user = userService.findByUsername(req.getUsername());
        } catch (Exception e) {
            failures.tryConsume(1);
            throw new BadCredentialsException("Incorrect username or password");
        }
        if (user.getPasswordHash() == null || user.getPasswordHash().isEmpty()) {
            failures.tryConsume(1);
            throw new BadCredentialsException("This account uses Google sign-in. Please use 'Continue with Google'.");
        }
        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            failures.tryConsume(1);
            throw new BadCredentialsException("Incorrect username or password");
        }

        loginFailures.remove(clientIp); // reset on success — only failures count toward the limit
        String token = jwtUtil.generateToken(user.getId());
        UserProfileDto profile = userService.toProfileDto(user);
        return new AuthResponse(token, profile);
    }

    private Bucket newFailureBucket() {
        Bandwidth limit = Bandwidth.builder()
                .capacity(5)
                .refillIntervally(5, Duration.ofMinutes(15))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }
}
