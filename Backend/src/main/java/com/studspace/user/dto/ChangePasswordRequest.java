package com.studspace.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChangePasswordRequest {
    @Size(max = 200) private String currentPassword;
    @NotBlank @Size(min = 8, max = 200) private String newPassword;
}
