package com.example.demo.controller;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.AccountService;

@RestController
@RequestMapping("/api/account")
public class AccountController {

    public record SettingsRequest(Boolean jobAlerts, Boolean messageAlerts, Boolean newsletter) {}
    public record PasswordRequest(String currentPassword, String newPassword) {}
    public record DeleteRequest(String password) {}

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final AccountService accountService;

    public AccountController(UserRepository users, PasswordEncoder encoder, AccountService accountService) {
        this.users = users;
        this.encoder = encoder;
        this.accountService = accountService;
    }

    private Optional<User> me(Authentication auth) {
        if (auth == null || auth.getName() == null) return Optional.empty();
        return users.findByGmailIgnoreCase(auth.getName());
    }

    private static ResponseEntity<?> msg(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("message", message));
    }

    private static Map<String, Object> settingsOf(User u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("jobAlerts", u.isJobAlerts());
        m.put("messageAlerts", u.isMessageAlerts());
        m.put("newsletter", u.isNewsletter());
        return m;
    }

    @GetMapping("/settings")
    public ResponseEntity<?> settings(Authentication auth) {
        User u = me(auth).orElse(null);
        if (u == null) return msg(HttpStatus.UNAUTHORIZED, "Please login again.");
        return ResponseEntity.ok(settingsOf(u));
    }

    @PutMapping("/settings")
    public ResponseEntity<?> saveSettings(@RequestBody SettingsRequest r, Authentication auth) {
        User u = me(auth).orElse(null);
        if (u == null) return msg(HttpStatus.UNAUTHORIZED, "Please login again.");
        if (r.jobAlerts() != null) u.setJobAlerts(r.jobAlerts());
        if (r.messageAlerts() != null) u.setMessageAlerts(r.messageAlerts());
        if (r.newsletter() != null) u.setNewsletter(r.newsletter());
        users.save(u);
        return ResponseEntity.ok(settingsOf(u));
    }

    @PutMapping("/password")
    public ResponseEntity<?> changePassword(@RequestBody PasswordRequest r, Authentication auth) {
        User u = me(auth).orElse(null);
        if (u == null) return msg(HttpStatus.UNAUTHORIZED, "Please login again.");
        if (r.currentPassword() == null || !encoder.matches(r.currentPassword(), u.getPassword())) {
            return msg(HttpStatus.BAD_REQUEST, "Current password is wrong.");
        }
        if (r.newPassword() == null || r.newPassword().length() < 8) {
            return msg(HttpStatus.BAD_REQUEST, "New password must be at least 8 characters.");
        }
        if (r.newPassword().equals(r.currentPassword())) {
            return msg(HttpStatus.BAD_REQUEST, "New password must be different from the current one.");
        }
        u.setPassword(encoder.encode(r.newPassword()));
        users.save(u);
        return ResponseEntity.ok(Map.of("message", "Password updated."));
    }

    @PostMapping("/delete")
    public ResponseEntity<?> delete(@RequestBody DeleteRequest r, Authentication auth) {
        User u = me(auth).orElse(null);
        if (u == null) return msg(HttpStatus.UNAUTHORIZED, "Please login again.");
        if ("ADMIN".equals(u.getRole().replace("ROLE_", "").toUpperCase())) {
            return msg(HttpStatus.FORBIDDEN, "The recruiter account cannot be deleted here.");
        }
        if (r.password() == null || !encoder.matches(r.password(), u.getPassword())) {
            return msg(HttpStatus.BAD_REQUEST, "Password is wrong.");
        }
        accountService.deleteUser(u);
        return ResponseEntity.ok(Map.of("message", "Account deleted."));
    }
}
