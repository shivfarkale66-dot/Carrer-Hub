package com.example.demo.controller;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.InterviewRequest;
import com.example.demo.dto.InterviewResponse;
import com.example.demo.entity.Interview;
import com.example.demo.entity.Notification;
import com.example.demo.entity.User;
import com.example.demo.repository.InterviewRepository;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.EmailNotifier;

@RestController
public class InterviewController {

    public record UserOption(Long id, String fullName, String gmail) {}
    public record RescheduleRequest(LocalDateTime scheduledAt, Integer durationMinutes, String note) {}
    public record CancelRequest(String reason) {}
    public record ResultRequest(Interview.Result result, String feedback) {}

    private static final DateTimeFormatter WHEN =
            DateTimeFormatter.ofPattern("EEE, d MMM yyyy 'at' h:mm a", Locale.ENGLISH);
    private static final String LINK = "/dashboard?tab=interviews";

    private final InterviewRepository interviews;
    private final UserRepository users;
    private final NotificationRepository notifications;
    private final EmailNotifier emailNotifier;

    public InterviewController(InterviewRepository interviews,
                               UserRepository users,
                               NotificationRepository notifications,
                               EmailNotifier emailNotifier) {
        this.interviews = interviews;
        this.users = users;
        this.notifications = notifications;
        this.emailNotifier = emailNotifier;
    }

    private static String cleanRole(User u) {
        return String.valueOf(u.getRole()).replace("ROLE_", "").toUpperCase();
    }

    private static boolean blank(String s) {
        return s == null || s.isBlank();
    }

    private static int minutesOf(Integer m) {
        return m == null ? 30 : m;
    }

    private static ResponseEntity<?> bad(String message) {
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }

    private static ResponseEntity<?> notFound() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Interview not found."));
    }

    private static ResponseEntity<?> conflict() {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("message", "This candidate already has an interview at that time."));
    }

    private static String describe(Interview i) {
        String company = blank(i.getCompanyName()) ? "" : " at " + i.getCompanyName();
        String type = i.getMode() == Interview.Mode.VIDEO ? "Video" : "Audio";
        return i.getJobTitle() + company + " (" + type + " interview)";
    }

    private void notifyUser(User user, String title, String message) {
        Notification n = new Notification();
        n.setUser(user);
        n.setTitle(title);
        n.setMessage(message);
        n.setLink(LINK);
        notifications.save(n);

        emailNotifier.emailUser(user.getGmail(), user.getFullName(), title, message, LINK);
    }

    private boolean overlaps(Long userId, LocalDateTime start, int minutes, Long ignoreId) {
        LocalDateTime end = start.plusMinutes(minutes);
        return interviews.findByUserIdAndStatus(userId, Interview.Status.SCHEDULED).stream()
                .filter(i -> !i.getId().equals(ignoreId))
                .anyMatch(i -> {
                    LocalDateTime s = i.getScheduledAt();
                    LocalDateTime e = s.plusMinutes(minutesOf(i.getDurationMinutes()));
                    return start.isBefore(e) && end.isAfter(s);
                });
    }

    @GetMapping("/api/admin/stats")
    public Map<String, Long> stats() {
        long candidates = users.findAll().stream()
                .filter(u -> "USER".equals(cleanRole(u))).count();
        return Map.of(
                "candidates", candidates,
                "scheduled", interviews.countByStatus(Interview.Status.SCHEDULED),
                "completed", interviews.countByStatus(Interview.Status.COMPLETED),
                "cancelled", interviews.countByStatus(Interview.Status.CANCELLED));
    }

    @GetMapping("/api/admin/users")
    public List<UserOption> candidates() {
        return users.findAll().stream()
                .filter(u -> "USER".equals(cleanRole(u)))
                .map(u -> new UserOption(u.getId(), u.getFullName(), u.getGmail()))
                .toList();
    }

    @GetMapping("/api/admin/interviews")
    public List<InterviewResponse> all() {
        return interviews.findAllByOrderByScheduledAtDesc().stream()
                .map(InterviewResponse::from).toList();
    }

    @PostMapping("/api/admin/interviews")
    public ResponseEntity<?> create(@RequestBody InterviewRequest r) {
        if (r.userId() == null) return bad("Please select a candidate.");
        if (blank(r.jobTitle())) return bad("Job title is required.");
        if (r.mode() == null) return bad("Please select Video or Audio.");
        if (r.scheduledAt() == null) return bad("Please select date and time.");
        if (!r.scheduledAt().isAfter(LocalDateTime.now())) return bad("Interview time must be in the future.");
        int minutes = minutesOf(r.durationMinutes());
        if (minutes < 5 || minutes > 240) return bad("Duration must be between 5 and 240 minutes.");

        User user = users.findById(r.userId()).orElse(null);
        if (user == null || !"USER".equals(cleanRole(user))) return bad("Candidate not found.");
        if (overlaps(user.getId(), r.scheduledAt(), minutes, null)) return conflict();

        Interview i = new Interview();
        i.setUser(user);
        i.setJobTitle(r.jobTitle().trim());
        i.setCompanyName(blank(r.companyName()) ? null : r.companyName().trim());
        i.setMode(r.mode());
        i.setScheduledAt(r.scheduledAt());
        i.setDurationMinutes(minutes);
        i.setNotes(blank(r.notes()) ? null : r.notes().trim());
        Interview saved = interviews.save(i);

        notifyUser(user, "Interview invitation",
                "You are invited for " + describe(saved) + " on " + saved.getScheduledAt().format(WHEN)
                        + ". You can join from your dashboard 10 minutes before the start.");
        return ResponseEntity.ok(InterviewResponse.from(saved));
    }

    @PutMapping("/api/admin/interviews/{id}/reschedule")
    public ResponseEntity<?> reschedule(@PathVariable Long id, @RequestBody RescheduleRequest r) {
        Interview i = interviews.findById(id).orElse(null);
        if (i == null) return notFound();
        if (i.getStatus() != Interview.Status.SCHEDULED)
            return bad("Only scheduled interviews can be rescheduled.");
        if (r.scheduledAt() == null) return bad("Please select date and time.");
        if (!r.scheduledAt().isAfter(LocalDateTime.now())) return bad("Interview time must be in the future.");
        int minutes = r.durationMinutes() == null ? minutesOf(i.getDurationMinutes()) : r.durationMinutes();
        if (minutes < 5 || minutes > 240) return bad("Duration must be between 5 and 240 minutes.");
        if (overlaps(i.getUser().getId(), r.scheduledAt(), minutes, i.getId())) return conflict();

        i.setScheduledAt(r.scheduledAt());
        i.setDurationMinutes(minutes);
        i.setReminder1hSent(false);
        i.setReminder10mSent(false);
        Interview saved = interviews.save(i);

        String extra = blank(r.note()) ? "" : " Note: " + r.note().trim();
        notifyUser(saved.getUser(), "Interview rescheduled",
                describe(saved) + " is now on " + saved.getScheduledAt().format(WHEN) + "." + extra);
        return ResponseEntity.ok(InterviewResponse.from(saved));
    }

    @PutMapping("/api/admin/interviews/{id}/cancel")
    public ResponseEntity<?> cancel(@PathVariable Long id, @RequestBody(required = false) CancelRequest r) {
        Interview i = interviews.findById(id).orElse(null);
        if (i == null) return notFound();
        if (i.getStatus() != Interview.Status.SCHEDULED)
            return bad("Only scheduled interviews can be cancelled.");

        String reason = (r == null || blank(r.reason())) ? null : r.reason().trim();
        i.setStatus(Interview.Status.CANCELLED);
        i.setFeedback(reason);
        Interview saved = interviews.save(i);

        notifyUser(saved.getUser(), "Interview cancelled",
                describe(saved) + " planned for " + saved.getScheduledAt().format(WHEN) + " has been cancelled.");
        return ResponseEntity.ok(InterviewResponse.from(saved));
    }

    @PutMapping("/api/admin/interviews/{id}/result")
    public ResponseEntity<?> result(@PathVariable Long id, @RequestBody ResultRequest r) {
        Interview i = interviews.findById(id).orElse(null);
        if (i == null) return notFound();
        if (i.getStatus() == Interview.Status.CANCELLED) return bad("A cancelled interview has no result.");
        if (r.result() == null || r.result() == Interview.Result.PENDING)
            return bad("Please choose Selected, Rejected or On hold.");
        if (i.getScheduledAt().isAfter(LocalDateTime.now()))
            return bad("You can update the result after the interview starts.");

        i.setResult(r.result());
        i.setFeedback(blank(r.feedback()) ? null : r.feedback().trim());
        i.setStatus(Interview.Status.COMPLETED);
        Interview saved = interviews.save(i);

        String text = switch (r.result()) {
            case SELECTED -> "Congratulations! You have been selected after " + describe(saved) + ".";
            case REJECTED -> "Thank you for your time. You were not selected after " + describe(saved) + " this time.";
            default -> "Your result for " + describe(saved) + " is on hold. We will update you soon.";
        };
        notifyUser(saved.getUser(), "Interview result", text);
        return ResponseEntity.ok(InterviewResponse.from(saved));
    }

    @GetMapping("/api/interviews/my")
    public List<InterviewResponse> mine(Authentication auth) {
        return interviews.findByUserGmailOrderByScheduledAtAsc(auth.getName()).stream()
                .map(InterviewResponse::forCandidate).toList();
    }
}
