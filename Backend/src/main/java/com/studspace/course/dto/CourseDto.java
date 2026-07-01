package com.studspace.course.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class CourseDto {
    private UUID id;
    private UUID semesterId;
    private String code;
    private String name;
    private String instructor;
    private int credits;
    private int presentCount;
    private int absentCount;
    private double attendancePercentage;
    private int resourceCount;
}
