package com.example.demo.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.entity.ContactMessage;
import com.example.demo.repository.ContactMessageRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.AdminNotifier;

@RestController
public class ContactController {

    public record ContactRequest(String name, String email, String subject, String message) {}

    public record ContactResponse(Long id, Long userId, String name, String email,
                                  String subject, String message, LocalDateTime createdAt) {
        static ContactResponse from(ContactMessage c) {
            return new ContactResponse(c.getId(), c.getUserId(), c.getName(), c.getEmail(),
                    c.getSubject(), c.getMessage(), c.getCreatedAt());
        }
    }

    private final ContactMessageRepository repo;
    private final UserRepository users;
    private final AdminNotifier adminNotifier;

    public ContactController(ContactMessageRepository repo, UserRepository users, AdminNotifier adminNotifier) {
        this.repo = repo;
        this.users = users;
        this.adminNotifier = adminNotifier;
    }

    private static boolean blank(String s) {
        return s == null || s.isBlank();
    }

    private static ResponseEntity<?> bad(String message) {
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }

    @PostMapping("/api/contact")
    public ResponseEntity<?> send(@RequestBody ContactRequest r, Authentication auth) {
        if (blank(r.name())) return bad("Please enter your name.");
        if (blank(r.email()) || !r.email().trim().matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$"))
            return bad("Please enter a valid email address.");
        if (blank(r.message()) || r.message().trim().length() < 10)
            return bad("Please write at least 10 characters in your message.");
        if (r.name().trim().length() > 100) return bad("Name is too long.");
        if (r.email().trim().length() > 200) return bad("Email is too long.");
        if (r.message().trim().length() > 3000) return bad("Message is too long (maximum 3000 characters).");

        ContactMessage c = new ContactMessage();
        c.setName(r.name().trim());
        c.setEmail(r.email().trim());
        c.setSubject(blank(r.subject()) ? "General" : r.subject().trim().substring(0, Math.min(100, r.subject().trim().length())));
        c.setMessage(r.message().trim());
        if (auth != null && auth.getName() != null) {
            users.findByGmailIgnoreCase(auth.getName()).ifPresent(u -> c.setUserId(u.getId()));
        }
        repo.save(c);

        adminNotifier.notifyAdmins("New contact message",
                c.getName() + " wrote: " + c.getSubject(), "/admin/contact");

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Message sent."));
    }

    @GetMapping("/api/admin/contact-messages")
    public List<ContactResponse> all() {
        return repo.findAllByOrderByCreatedAtDesc().stream().map(ContactResponse::from).toList();
    }

    @DeleteMapping("/api/admin/contact-messages/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Not found."));
        repo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted."));
    }
}
