package com.studspace.semester.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateSemesterRequest {

    @NotBlank(message = "Semester label is required")
    @Size(max = 100) private String label;

    @Size(max = 20) private String shortName;
    private boolean current;
}
