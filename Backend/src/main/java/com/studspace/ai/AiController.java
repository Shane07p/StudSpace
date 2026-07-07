package com.studspace.ai;

import com.studspace.ai.dto.AttachResourceRequest;
import com.studspace.ai.dto.ChatRequest;
import com.studspace.ai.dto.ConversationDetailDto;
import com.studspace.ai.dto.ConversationDto;
import com.studspace.ai.dto.CreateConversationRequest;
import com.studspace.ai.dto.SendMessageRequest;
import com.studspace.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;
    private final ConversationService conversationService;

    // Legacy one-shot chat (kept until the frontend fully moves to conversations)
    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<Map<String, String>>> chat(
            @Valid @RequestBody ChatRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        String reply = aiService.chat(req.getMessage(), req.getResourceId(), uid(principal));
        return ResponseEntity.ok(ApiResponse.ok(Map.of("reply", reply)));
    }

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<ConversationDto>>> list(
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(ApiResponse.ok(conversationService.list(uid(principal))));
    }

    @PostMapping("/conversations")
    public ResponseEntity<ApiResponse<ConversationDetailDto>> create(
            @Valid @RequestBody CreateConversationRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(conversationService.create(uid(principal), req)));
    }

    @GetMapping("/conversations/{id}")
    public ResponseEntity<ApiResponse<ConversationDetailDto>> get(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(ApiResponse.ok(conversationService.get(id, uid(principal))));
    }

    @PostMapping("/conversations/{id}/messages")
    public ResponseEntity<ApiResponse<ConversationDetailDto>> sendMessage(
            @PathVariable UUID id,
            @Valid @RequestBody SendMessageRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(ApiResponse.ok(
                conversationService.sendMessage(id, uid(principal), req.getContent())));
    }

    @PutMapping("/conversations/{id}/resource")
    public ResponseEntity<ApiResponse<ConversationDetailDto>> attachResource(
            @PathVariable UUID id,
            @RequestBody AttachResourceRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(ApiResponse.ok(
                conversationService.attachResource(id, uid(principal), req.getResourceId())));
    }

    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails principal) {
        conversationService.delete(id, uid(principal));
        return ResponseEntity.ok(ApiResponse.ok(null, "Conversation deleted"));
    }

    private UUID uid(UserDetails p) {
        return UUID.fromString(p.getUsername());
    }
}
