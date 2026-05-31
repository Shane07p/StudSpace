package com.studspace.share;

import com.studspace.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/share")
@RequiredArgsConstructor
public class ShareController {

    private final ShareService shareService;

    @GetMapping("/{token}")
    public ResponseEntity<ApiResponse<ShareService.ShareResponse>> getShared(@PathVariable String token) {
        return ResponseEntity.ok(ApiResponse.ok(shareService.getSharedView(token)));
    }
}
