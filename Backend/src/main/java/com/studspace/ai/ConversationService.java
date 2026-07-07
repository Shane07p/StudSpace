package com.studspace.ai;

import com.studspace.ai.dto.ConversationDetailDto;
import com.studspace.ai.dto.ConversationDto;
import com.studspace.ai.dto.CreateConversationRequest;
import com.studspace.ai.dto.MessageDto;
import com.studspace.common.ForbiddenException;
import com.studspace.common.NotFoundException;
import com.studspace.resource.ResourceService;
import com.studspace.resource.dto.ResourceDto;
import com.studspace.user.User;
import com.studspace.user.UserService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private static final Logger log = LoggerFactory.getLogger(ConversationService.class);

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final AiService aiService;
    private final GroqClient groq;
    private final GeminiClient gemini;
    private final ResourceService resourceService;
    private final UserService userService;

    public List<ConversationDto> list(UUID userId) {
        return conversationRepository.findByUserIdOrderByUpdatedAtDesc(userId)
                .stream().map(this::toDto).toList();
    }

    public ConversationDetailDto get(UUID convId, UUID userId) {
        return toDetail(getOwned(convId, userId));
    }

    @Transactional
    public ConversationDetailDto create(UUID userId, CreateConversationRequest req) {
        User user = userService.findById(userId);
        Conversation c = conversationRepository.save(Conversation.builder()
                .user(user)
                .resourceId(req.getResourceId())
                .title("New chat")
                .build());
        if (req.getMessage() != null && !req.getMessage().isBlank()) {
            reply(c, req.getMessage());
        }
        return toDetail(c);
    }

    @Transactional
    public ConversationDetailDto sendMessage(UUID convId, UUID userId, String content) {
        Conversation c = getOwned(convId, userId);
        reply(c, content);
        return toDetail(c);
    }

    // Attach (or detach with resourceId == null) a resource to an existing conversation.
    @Transactional
    public ConversationDetailDto attachResource(UUID convId, UUID userId, UUID resourceId) {
        Conversation c = getOwned(convId, userId);
        if (resourceId != null) resourceService.getOne(resourceId, userId); // verify ownership
        c.setResourceId(resourceId);
        conversationRepository.save(c);
        return toDetail(c);
    }

    @Transactional
    public void delete(UUID convId, UUID userId) {
        getOwned(convId, userId);
        conversationRepository.deleteById(convId);
    }

    // Append the user message, call the AI with the full conversation history (multi-turn memory),
    // then append the assistant reply. System prompt is rebuilt each turn with fresh real-data context.
    private void reply(Conversation c, String userContent) {
        UUID userId = c.getUser().getId();
        messageRepository.save(Message.builder()
                .conversation(c).role(MessageRole.USER).content(userContent).build());
        if (c.getTitle() == null || c.getTitle().equals("New chat")) {
            c.setTitle(userContent.length() > 60 ? userContent.substring(0, 60) : userContent);
        }

        List<Message> history = messageRepository.findByConversationIdOrderByCreatedAtAsc(c.getId());
        List<Map<String, String>> turns = new ArrayList<>();
        for (Message m : history) {
            turns.add(Map.of(
                    "role", m.getRole() == MessageRole.USER ? "user" : "assistant",
                    "content", m.getContent()));
        }

        String replyText = generate(c.getResourceId(), userId, turns);
        messageRepository.save(Message.builder()
                .conversation(c).role(MessageRole.ASSISTANT).content(replyText).build());
        conversationRepository.save(c); // touch updated_at + persist title
    }

    // PDF resource + Gemini available → read the PDF; otherwise Groq with a system prompt built from DB data.
    private String generate(UUID resourceId, UUID userId, List<Map<String, String>> turns) {
        ResourceDto res = resourceId != null ? safeResource(resourceId, userId) : null;
        boolean isPdf = res != null && res.getUrl() != null && res.getUrl().toLowerCase().contains(".pdf");

        if (isPdf && gemini.isEnabled()) {
            try {
                byte[] pdf = gemini.fetchBytes(res.getUrl());
                log.info("Gemini reading PDF {} ({} bytes)", res.getUrl(), pdf.length);
                return gemini.ask(pdf, pdfInstruction(res), turns);
            } catch (Exception e) {
                log.warn("Gemini PDF read failed, falling back to Groq", e);
            }
        }

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", aiService.buildSystemPrompt(resourceId, userId)));
        messages.addAll(turns);
        return groq.chat(messages);
    }

    private ResourceDto safeResource(UUID resourceId, UUID userId) {
        try { return resourceService.getOne(resourceId, userId); }
        catch (Exception e) { return null; }
    }

    private String pdfInstruction(ResourceDto res) {
        String course = res.getCourseName() != null ? " for the course " + res.getCourseName() : "";
        return "You are a study assistant for a college student. The attached PDF is their resource \""
                + res.getTitle() + "\"" + course + ". Answer their questions using the PDF's content — "
                + "explain, summarize, or solve based on it. Be concise, friendly, and academically helpful. Keep replies under 250 words.";
    }

    private Conversation getOwned(UUID convId, UUID userId) {
        Conversation c = conversationRepository.findById(convId)
                .orElseThrow(() -> new NotFoundException("Conversation not found"));
        if (!c.getUser().getId().equals(userId)) throw new ForbiddenException("Access denied");
        return c;
    }

    private ConversationDto toDto(Conversation c) {
        ConversationDto d = new ConversationDto();
        d.setId(c.getId());
        d.setTitle(c.getTitle());
        d.setResourceId(c.getResourceId());
        d.setResourceTitle(resolveTitle(c));
        d.setUpdatedAt(c.getUpdatedAt());
        return d;
    }

    private ConversationDetailDto toDetail(Conversation c) {
        ConversationDetailDto d = new ConversationDetailDto();
        d.setId(c.getId());
        d.setTitle(c.getTitle());
        d.setResourceId(c.getResourceId());
        d.setResourceTitle(resolveTitle(c));
        d.setMessages(messageRepository.findByConversationIdOrderByCreatedAtAsc(c.getId())
                .stream().map(this::toMsg).toList());
        return d;
    }

    private String resolveTitle(Conversation c) {
        ResourceDto r = c.getResourceId() != null
                ? safeResource(c.getResourceId(), c.getUser().getId()) : null;
        return r != null ? r.getTitle() : null;
    }

    private MessageDto toMsg(Message m) {
        MessageDto d = new MessageDto();
        d.setId(m.getId());
        d.setRole(m.getRole().name().toLowerCase());
        d.setContent(m.getContent());
        d.setCreatedAt(m.getCreatedAt());
        return d;
    }
}
