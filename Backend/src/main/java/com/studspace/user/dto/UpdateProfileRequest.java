package com.studspace.user.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {
    @Size(max = 100) private String fullName;
    @Size(max = 200) private String college;
    @Size(max = 100) private String branch;
    @Min(1) @Max(10) private Integer year;
    @Size(max = 500) private String bio;
}
