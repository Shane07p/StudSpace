package com.studspace.user.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class HandleDto {
    private UUID id;
    private String platform;
    private String url;
    private int displayOrder;
}
