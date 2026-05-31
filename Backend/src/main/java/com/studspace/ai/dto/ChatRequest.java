package com.studspace.ai.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChatRequest {
    @NotBlank(message = "Message is required")
    @Size(max = 4000) private String message;
    private JsonNode context;
}
