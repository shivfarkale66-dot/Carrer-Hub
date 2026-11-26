package com.example.demo.controller;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.example.demo.dto.AdminApplicationResponse;
import com.example.demo.entity.JobApplication;
import com.example.demo.entity.Notification;
import com.example.demo.repository.ApplicationResumeRepository;
import com.example.demo.service.EmailNotifier;
import com.example.demo.repository.JobApplicationRepository;
import com.example.demo.repository.NotificationRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/applications")
public class AdminApplicationController {

    public record StatusRequest(String status, String note) {}

    private static final List<String> ALLOWED =
            List.of("In review", "Shortlisted", "Confirmed", "Rejected");

    private final JobApplicationRepository applications;
    private final NotificationRepository notifications;
    private final ApplicationResumeRepository resumes;
    private final EmailNotifier emailNotifier;

    public AdminApplicationController(JobApplicationRepository applications,
                                      NotificationRepository notifications,
                                      ApplicationResumeRepository resumes,
                                      EmailNotifier emailNotifier) {
        this.applications = applications;
        this.notifications = notifications;
        this.resumes = resumes;
        this.emailNotifier = emailNotifier;
    }

    private static ResponseEntity<?> msg(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("message", message));
    }

    @GetMapping
    public List<AdminApplicationResponse> all() {

        Set<Long> withResume = new HashSet<>(resumes.findAllApplicationIds());
        return applications.findAllByOrderByAppliedAtDesc().stream()
                .map(a -> AdminApplicationResponse.from(a, withResume.contains(a.getId()))).toList();
    }

    @GetMapping("/{id}/resume")
    public ResponseEntity<?> resume(@PathVariable Long id) {
        return resumes.findByApplicationId(id)
                .<ResponseEntity<?>>map(r -> ResponseEntity.ok(Map.of("name", r.getName(), "data", r.getData())))
                .orElseGet(() -> msg(HttpStatus.NOT_FOUND, "No resume was sent with this application."));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> setStatus(@PathVariable Long id, @RequestBody StatusRequest r) {
        JobApplication a = applications.findById(id).orElse(null);
        if (a == null) return msg(HttpStatus.NOT_FOUND, "Application not found.");

        String wanted = r.status() == null ? "" : r.status().trim();
        String status = ALLOWED.stream()
                .filter(s -> s.equalsIgnoreCase(wanted)).findFirst().orElse(null);
        if (status == null) {
            return msg(HttpStatus.BAD_REQUEST, "Status must be one of: " + String.join(", ", ALLOWED));
        }
        if ("Cancelled".equalsIgnoreCase(a.getStatus())) {
            return msg(HttpStatus.BAD_REQUEST, "The candidate has cancelled this application.");
        }

        a.setStatus(status);
        a.setAdminNote(r.note() == null || r.note().isBlank() ? null : r.note().trim());
        JobApplication saved = applications.save(a);

        String job = saved.getJob().getTitle() + " at " + saved.getJob().getCompany().getName();
        String text = switch (status) {
            case "Shortlisted" -> "Good news! You have been shortlisted for " + job + ".";
            case "Confirmed" -> "Congratulations! Your application for " + job
                    + " is confirmed. The recruiter will contact you with the next steps.";
            case "Rejected" -> "Thank you for applying. Your application for " + job
                    + " was not selected this time.";
            default -> "Your application for " + job + " is now under review.";
        };

        Notification n = new Notification();
        n.setUser(saved.getUser());
        n.setTitle("Application update");
        n.setMessage(text);
        n.setLink("/dashboard?tab=applied");
        notifications.save(n);

        emailNotifier.emailUser(saved.getUser().getGmail(), saved.getUser().getFullName(),
                "Application update", text, "/dashboard?tab=applied");

        return ResponseEntity.ok(AdminApplicationResponse.from(saved, resumes.existsByApplicationId(saved.getId())));
    }
}
