package com.example.demo.controller;

import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.EmailVerificationService;
import com.example.demo.service.EmailVerificationService.VerificationException;
import com.example.demo.service.MailService;

@RestController
@RequestMapping("/api/auth")
public class EmailVerificationController {

    private final EmailVerificationService service;
    private final UserRepository users;
    private final MailService mail;

    public EmailVerificationController(EmailVerificationService service, UserRepository users, MailService mail) {
        this.service = service;
        this.users = users;
        this.mail = mail;
    }

    private static String first(Map<String, String> body, String... keys) {
        for (String k : keys) {
            String v = body.get(k);
            if (v != null && !v.isBlank()) return v.trim();
        }
        return null;
    }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verify(@RequestBody Map<String, String> body) {
        String gmail = first(body, "email", "gmail");
        String code = first(body, "code");
        if (gmail == null || code == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and code are required"));
        }
        try {
            service.verify(gmail, code);
        } catch (VerificationException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
        return ResponseEntity.ok(Map.of("message", "Email verified. You can login now."));
    }

    @PostMapping("/resend-code")
    public ResponseEntity<?> resend(@RequestBody Map<String, String> body) {
        String gmail = first(body, "email", "gmail");
        if (gmail == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
        }
        if (!mail.canDeliver()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("message", "Email service is not set up on the server yet."));
        }
        Optional<User> found = users.findByGmailIgnoreCase(gmail);
        if (found.isPresent() && !found.get().isEmailVerified()) {
            try {
                service.sendCode(found.get());
            } catch (VerificationException e) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body(Map.of("message", e.getMessage()));
            }
        }
        return ResponseEntity.ok(Map.of("message", "If this email needs verification, a new code has been sent."));
    }
}
