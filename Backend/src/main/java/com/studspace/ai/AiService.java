package com.studspace.ai;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class AiService {

    private final GroqClient groq;

    public AiService(GroqClient groq) {
        this.groq = groq;
    }

    public String chat(String message, JsonNode context) {
        String contextStr = context != null ? context.toString() : "not provided";
        String systemPrompt = """
                You are a helpful study assistant for a college student using StudSpace, a study management app.
                The student's current semester context (JSON): %s
                Answer questions about their courses, help explain concepts, suggest study strategies, or help with academic topics.
                Be concise, friendly, and academically helpful. Keep replies under 200 words."""
                .formatted(contextStr);
        var messages = List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", message)
        );
        return groq.chat(messages);
    }
}
