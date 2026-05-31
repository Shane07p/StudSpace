package com.studspace.resource.dto;

import com.studspace.resource.ResourceType;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class ResourceDto {
    private UUID id;
    private UUID courseId;
    private String courseName;
    private ResourceType type;
    private String title;
    private String url;
    private String notes;
    private LocalDateTime createdAt;
}
