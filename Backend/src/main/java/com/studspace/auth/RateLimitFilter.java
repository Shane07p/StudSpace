package com.studspace.auth;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Order(1)
public class RateLimitFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    private Bucket newBucket() {
        Bandwidth limit = Bandwidth.builder()
                .capacity(5)
                .refillIntervally(5, Duration.ofMinutes(15))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String path = req.getRequestURI();
        if (!path.startsWith("/api/auth/login") && !path.startsWith("/api/auth/register")) {
            chain.doFilter(req, res);
            return;
        }
        String ip = getIp(req);
        if (buckets.computeIfAbsent(ip, k -> newBucket()).tryConsume(1)) {
            chain.doFilter(req, res);
        } else {
            res.setStatus(429);
            res.setContentType("application/json");
            res.getWriter().write("{\"error\":\"Too many requests. Please wait 15 minutes before trying again.\"}");
        }
    }

    private String getIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            String[] parts = xff.split(",");
            // Walk right-to-left: trailing entries are our own nginx hops (private/loopback),
            // appended via $proxy_add_x_forwarded_for. The first public address from the right is
            // the real client; any client-supplied (spoofed) value sits further left and is ignored.
            for (int i = parts.length - 1; i >= 0; i--) {
                String ip = parts[i].trim();
                if (!ip.isEmpty() && !isPrivateOrLoopback(ip)) {
                    return ip;
                }
            }
        }
        return req.getRemoteAddr();
    }

    private boolean isPrivateOrLoopback(String ip) {
        return ip.startsWith("127.")
                || ip.startsWith("10.")
                || ip.startsWith("192.168.")
                || ip.startsWith("::1")
                || ip.equals("0:0:0:0:0:0:0:1")
                || ip.matches("^172\\.(1[6-9]|2[0-9]|3[0-1])\\..*");
    }
}
