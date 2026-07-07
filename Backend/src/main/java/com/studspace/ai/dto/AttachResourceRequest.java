package com.studspace.ai.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class AttachResourceRequest {
    private UUID resourceId; // null = detach
}
