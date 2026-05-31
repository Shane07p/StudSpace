package com.studspace.auth;

import com.studspace.user.User;
import com.studspace.user.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;
    private final UserService userService;

    @Value("${app.frontend-url:http://localhost}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) authentication;
        Map<String, Object> attrs = token.getPrincipal().getAttributes();

        String googleSub = (String) attrs.get("sub");
        String email     = (String) attrs.get("email");
        String name      = (String) attrs.get("name");

        User user = userService.findOrCreateGoogleUser(email, name, googleSub);
        String jwt = jwtUtil.generateToken(user.getId());

        String redirectUrl = UriComponentsBuilder
                .fromUriString(frontendUrl + "/dashboard.html")
                .queryParam("token", jwt)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
