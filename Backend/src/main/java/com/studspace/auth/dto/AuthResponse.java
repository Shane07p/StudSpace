package com.studspace.auth.dto;

import com.studspace.user.dto.UserProfileDto;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private UserProfileDto user;
}
