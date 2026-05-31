package com.studspace.slot.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class TimetableSlotDto {
    private UUID id;
    private String day;
    private String start;
    private String end;
    private String room;
    private UUID courseId;
    private String courseCode;
    private String courseName;
}
