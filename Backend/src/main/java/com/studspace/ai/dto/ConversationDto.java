package com.studspace.ai.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class ConversationDto {
    private UUID id;
    private String title;
    private UUID resourceId;
    private String resourceTitle;
    private LocalDateTime updatedAt;
}
