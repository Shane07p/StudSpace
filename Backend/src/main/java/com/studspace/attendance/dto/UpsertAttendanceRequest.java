package com.studspace.attendance.dto;

import com.studspace.attendance.AttendanceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpsertAttendanceRequest {

    @NotNull(message = "Date is required")
    private LocalDate date;

    @NotNull(message = "Status is required")
    private AttendanceStatus status;
}
