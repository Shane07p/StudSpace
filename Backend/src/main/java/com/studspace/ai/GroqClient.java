package com.studspace.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Component
public class GroqClient {

    private final RestClient restClient;

    @Value("${groq.api-key}")
    private String apiKey;

    public GroqClient(RestClient.Builder builder) {
        this.restClient = builder
                .baseUrl("https://api.groq.com")
                .build();
    }

    @SuppressWarnings("unchecked")
    public String chat(List<Map<String, String>> messages) {
        var body = Map.of(
                "model", "llama-3.3-70b-versatile",
                "messages", messages,
                "max_tokens", 1024
        );
        var response = restClient.post()
                .uri("/openai/v1/chat/completions")
                .header("Authorization", "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(Map.class);

        var choices = (List<Map<String, Object>>) response.get("choices");
        var message = (Map<String, Object>) choices.get(0).get("message");
        return (String) message.get("content");
    }
}
