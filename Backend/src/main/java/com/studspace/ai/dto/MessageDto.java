package com.studspace.ai.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class MessageDto {
    private UUID id;
    private String role;
    private String content;
    private LocalDateTime createdAt;
}
