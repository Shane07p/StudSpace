package com.studspace.ai;

import com.studspace.ai.dto.ChatRequest;
import com.studspace.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<Map<String, String>>> chat(
            @Valid @RequestBody ChatRequest req) {
        String reply = aiService.chat(req.getMessage(), req.getContext());
        return ResponseEntity.ok(ApiResponse.ok(Map.of("reply", reply)));
    }
}
