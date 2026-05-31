package com.studspace.user.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PhotoRequest {
    @Size(max = 2000) private String photo;
}
