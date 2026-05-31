package com.studspace.semester.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class SemesterDto {
    private UUID id;
    private String label;
    private String shortName;
    private boolean current;
    private boolean shared;
    private String shareToken;
    private LocalDateTime createdAt;
}
