package com.studspace.slot.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateSlotRequest {
    @NotBlank @Size(max = 5) private String day;
    @NotBlank @Size(max = 5) private String start;
    @NotBlank @Size(max = 5) private String end;
    @Size(max = 100) private String room;
    private UUID courseId;
}
