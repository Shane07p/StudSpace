package com.studspace.user.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserProfileDto {
    private UUID id;
    private String username;
    private String email;
    private String fullName;
    private String college;
    private String branch;
    private Integer year;
    private String bio;
    private boolean hasPassword;
    private String profilePhoto;
    private String coverPhoto;
    private List<HandleDto> handles;
}
