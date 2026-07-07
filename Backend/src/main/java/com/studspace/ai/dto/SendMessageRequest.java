package com.studspace.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SendMessageRequest {
    @NotBlank(message = "Message is required")
    @Size(max = 4000) private String content;
}
