package com.studspace.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * Google Gemini multimodal client — reads PDF resources (Groq LLaMA is text-only).
 * Disabled (isEnabled() == false) when GEMINI_API_KEY is not set; callers fall back to Groq.
 */
@Component
public class GeminiClient {

    // Only PDFs served from our own Cloudinary delivery host may be fetched — prevents SSRF
    // via user-controlled LINK resource URLs (internal services, cloud metadata, etc.).
    private static final long MAX_PDF_BYTES = 25L * 1024 * 1024; // matches the upload limit

    private final RestClient rest;
    private final RestClient fetchClient;

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String model;

    @Value("${gemini.pdf-allowed-host:res.cloudinary.com}")
    private String allowedHost;

    public GeminiClient(RestClient.Builder builder) {
        this.rest = builder.baseUrl("https://generativelanguage.googleapis.com").build();
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(15000);
        this.fetchClient = RestClient.builder().requestFactory(factory).build();
    }

    public boolean isEnabled() {
        return apiKey != null && !apiKey.isBlank();
    }

    /**
     * Download the raw PDF bytes. Restricted to https on the configured Cloudinary host
     * (SSRF guard) with connect/read timeouts and a size cap.
     */
    public byte[] fetchBytes(String url) {
        URI uri = URI.create(url);
        String host = uri.getHost();
        if (!"https".equalsIgnoreCase(uri.getScheme()) || host == null || !host.equalsIgnoreCase(allowedHost)) {
            throw new IllegalArgumentException("Refusing to fetch a non-Cloudinary URL");
        }
        byte[] body = fetchClient.get().uri(uri).retrieve().body(byte[].class);
        if (body != null && body.length > MAX_PDF_BYTES) {
            throw new IllegalStateException("PDF exceeds the size limit");
        }
        return body;
    }

    /**
     * Ask Gemini with the PDF attached and the full conversation history.
     * history entries are {"role": "user"|"assistant", "content": "..."}.
     */
    @SuppressWarnings("unchecked")
    public String ask(byte[] pdf, String systemInstruction, List<Map<String, String>> history) {
        String b64 = Base64.getEncoder().encodeToString(pdf);

        List<Map<String, Object>> contents = new ArrayList<>();
        boolean pdfAttached = false;
        for (Map<String, String> m : history) {
            String role = "assistant".equals(m.get("role")) ? "model" : "user";
            List<Map<String, Object>> parts = new ArrayList<>();
            if (!pdfAttached && role.equals("user")) {
                parts.add(Map.of("inline_data", Map.of("mime_type", "application/pdf", "data", b64)));
                pdfAttached = true;
            }
            parts.add(Map.of("text", m.get("content")));
            contents.add(Map.of("role", role, "parts", parts));
        }

        Map<String, Object> body = Map.of(
                "system_instruction", Map.of("parts", List.of(Map.of("text", systemInstruction))),
                "contents", contents
        );

        Map<String, Object> resp = rest.post()
                .uri("/v1beta/models/{model}:generateContent?key={key}", model, apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(Map.class);

        var candidates = (List<Map<String, Object>>) resp.get("candidates");
        var content = (Map<String, Object>) candidates.get(0).get("content");
        var parts = (List<Map<String, Object>>) content.get("parts");
        return (String) parts.get(0).get("text");
    }
}
