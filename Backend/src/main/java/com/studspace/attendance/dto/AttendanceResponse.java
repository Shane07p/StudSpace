package com.studspace.attendance.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class AttendanceResponse {
    private List<AttendanceDto> records;
    private AttendanceSummaryDto summary;
}
