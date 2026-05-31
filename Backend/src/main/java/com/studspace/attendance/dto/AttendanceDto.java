package com.studspace.attendance.dto;

import com.studspace.attendance.AttendanceStatus;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class AttendanceDto {
    private UUID id;
    private UUID courseId;
    private LocalDate date;
    private AttendanceStatus status;
}
