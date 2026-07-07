package com.studspace.ai.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateConversationRequest {
    private UUID resourceId;
    @Size(max = 4000) private String message;
}
