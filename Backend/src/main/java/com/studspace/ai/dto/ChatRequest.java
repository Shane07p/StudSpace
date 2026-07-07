package com.studspace.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class ChatRequest {
    @NotBlank(message = "Message is required")
    @Size(max = 4000) private String message;

    // Optional — when the user asks about a specific resource/note. Backend loads it and builds context.
    private UUID resourceId;
}
