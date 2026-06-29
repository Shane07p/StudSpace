package com.studspace.common;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Resolves the real client IP from X-Forwarded-For. Our nginx hops are appended
 * (trailing/private), so we take the right-most public entry; any client-supplied
 * value sits further left and is ignored. Shared by RateLimitFilter and AuthController.
 */
public final class ClientIp {

    private ClientIp() {}

    public static String from(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            String[] parts = xff.split(",");
            for (int i = parts.length - 1; i >= 0; i--) {
                String ip = parts[i].trim();
                if (!ip.isEmpty() && !isPrivateOrLoopback(ip)) {
                    return ip;
                }
            }
        }
        return req.getRemoteAddr();
    }

    private static boolean isPrivateOrLoopback(String ip) {
        return ip.startsWith("127.")
                || ip.startsWith("10.")
                || ip.startsWith("192.168.")
                || ip.startsWith("::1")
                || ip.equals("0:0:0:0:0:0:0:1")
                || ip.matches("^172\\.(1[6-9]|2[0-9]|3[0-1])\\..*");
    }
}
