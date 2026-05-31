package com.studspace.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class UpdateHandlesRequest {
    private List<HandleItem> handles;

    @Data
    public static class HandleItem {
        @NotBlank(message = "Platform is required")
        @Size(max = 50) private String platform;
        @Size(max = 2000) private String url;
        private int displayOrder;
    }
}
