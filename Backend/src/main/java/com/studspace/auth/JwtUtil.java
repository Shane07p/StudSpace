package com.studspace.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtUtil {

    private final SecretKey key;
    private final long expiryMillis;

    public JwtUtil(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiry-days}") int expiryDays) {
        byte[] keyBytes = Base64.getDecoder().decode(secret);
        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.expiryMillis = (long) expiryDays * 24 * 60 * 60 * 1000;
    }

    public String generateToken(UUID userId) {
        Date now = new Date();
        return Jwts.builder()
                .subject(userId.toString())
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expiryMillis))
                .signWith(key)
                .compact();
    }

    public UUID extractUserId(String token) {
        return UUID.fromString(parseClaims(token).getSubject());
    }

    public boolean isValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
