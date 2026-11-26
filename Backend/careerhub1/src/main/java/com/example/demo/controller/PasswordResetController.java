package com.example.demo.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.service.PasswordResetService;
import com.example.demo.service.PasswordResetService.ResetException;

@RestController
@RequestMapping("/api/auth")
public class PasswordResetController {

    private final PasswordResetService service;

    public PasswordResetController(PasswordResetService service) {
        this.service = service;
    }

    private static String first(Map<String, String> body, String... keys) {
        for (String k : keys) {
            String v = body.get(k);
            if (v != null && !v.isBlank()) return v.trim();
        }
        return null;
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgot(@RequestBody Map<String, String> body) {
        String gmail = first(body, "email", "gmail");
        if (gmail == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
        }
        try {
            service.request(gmail);
        } catch (ResetException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("message", e.getMessage()));
        }
        return ResponseEntity.ok(Map.of("message",
                "If this email is registered, a 6 digit code has been sent to it."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> reset(@RequestBody Map<String, String> body) {
        String gmail = first(body, "email", "gmail");
        String code = first(body, "code");
        String password = body.get("password") != null ? body.get("password") : body.get("newPassword");
        if (gmail == null || code == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "All fields are required"));
        }
        try {
            service.reset(gmail, code, password);
        } catch (ResetException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
        return ResponseEntity.ok(Map.of("message", "Password updated. Please login."));
    }
}
