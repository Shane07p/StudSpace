package com.studspace.ai;

import com.studspace.course.dto.CourseDto;
import com.studspace.dashboard.DashboardService;
import com.studspace.resource.ResourceType;
import com.studspace.resource.ResourceService;
import com.studspace.resource.dto.ResourceDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AiService {

    private final GroqClient groq;
    private final ResourceService resourceService;
    private final DashboardService dashboardService;

    public String chat(String message, UUID resourceId, UUID userId) {
        var messages = List.of(
                Map.of("role", "system", "content", buildSystemPrompt(resourceId, userId)),
                Map.of("role", "user", "content", message)
        );
        return groq.chat(messages);
    }

    public String buildSystemPrompt(UUID resourceId, UUID userId) {
        String context = resourceId != null
                ? buildResourceContext(resourceId, userId)
                : buildSemesterContext(userId);
        return """
                You are a study assistant for a college student using StudSpace, a study management app.
                Use the student's own data below when it helps answer.

                %s

                Answer their question: explain concepts, discuss the resource/notes, or suggest study strategies.
                Be concise, friendly, and academically helpful. Keep replies under 200 words."""
                .formatted(context);
    }

    private String buildResourceContext(UUID resourceId, UUID userId) {
        ResourceDto r = resourceService.getOne(resourceId, userId);
        StringBuilder sb = new StringBuilder("The student is asking about this resource:\n");
        sb.append("Title: ").append(r.getTitle()).append("\n");
        sb.append("Type: ").append(r.getType()).append("\n");
        if (r.getCourseName() != null) sb.append("Course: ").append(r.getCourseName()).append("\n");
        if (r.getUrl() != null && !r.getUrl().isBlank()) sb.append("URL: ").append(r.getUrl()).append("\n");
        if (r.getNotes() != null && !r.getNotes().isBlank()) {
            sb.append("Notes content:\n").append(truncate(r.getNotes(), 3000)).append("\n");
        } else if (r.getType() != ResourceType.NOTES) {
            sb.append("(This is a ").append(r.getType())
              .append("; its file/link content is not readable here — only the title and URL above.)\n");
        }
        return sb.toString();
    }

    private String buildSemesterContext(UUID userId) {
        var dash = dashboardService.getDashboard(userId);
        var cur = dash.getCurrentSemester();
        if (cur == null) return "The student has no active semester with courses yet.";
        StringBuilder sb = new StringBuilder();
        sb.append("Current semester: ").append(cur.getSemester().getLabel()).append("\n");
        sb.append("Overall attendance: ").append(dash.getStats().getOverallAttendance()).append("%\n");
        sb.append("Courses:\n");
        for (CourseDto c : cur.getCourses()) {
            sb.append("- ").append(c.getName());
            if (c.getCode() != null && !c.getCode().isBlank()) sb.append(" (").append(c.getCode()).append(")");
            sb.append(" — attendance ").append(c.getAttendancePercentage()).append("%\n");
        }
        return sb.toString();
    }

    private String truncate(String s, int max) {
        return s.length() <= max ? s : s.substring(0, max) + "…";
    }
}
