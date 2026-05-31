package com.studspace.attendance.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AttendanceSummaryDto {
    private int present;
    private int absent;
    private int cancelled;
    private int total;
    private double percentage;
    private int classesNeededFor75;
}
