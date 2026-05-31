package com.studspace.resource.dto;

import com.studspace.resource.ResourceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateResourceRequest {

    @NotNull(message = "Resource type is required")
    private ResourceType type;

    @NotBlank(message = "Title is required")
    @Size(max = 200) private String title;

    @Size(max = 2000) private String url;
    @Size(max = 1000) private String notes;
}
