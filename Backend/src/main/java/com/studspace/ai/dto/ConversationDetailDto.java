package com.studspace.ai.dto;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class ConversationDetailDto {
    private UUID id;
    private String title;
    private UUID resourceId;
    private String resourceTitle;
    private List<MessageDto> messages;
}
