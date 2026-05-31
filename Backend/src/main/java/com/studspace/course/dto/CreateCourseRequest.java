package com.studspace.course.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateCourseRequest {

    @Size(max = 20) private String code;

    @NotBlank(message = "Course name is required")
    @Size(max = 200) private String name;

    @Size(max = 100) private String instructor;
    @Min(1) @Max(20) private Integer credits;
}
