package com.example.demo.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.entity.Notification;
import com.example.demo.repository.NotificationRepository;

@RestController
public class NotificationController {

    public record NotificationDto(Long id, String title, String message,
                                  String link, boolean read, LocalDateTime createdAt) {}

    private final NotificationRepository notifications;

    public NotificationController(NotificationRepository notifications) {
        this.notifications = notifications;
    }

    @GetMapping("/api/notifications/my")
    public List<NotificationDto> mine(Authentication auth) {
        return notifications.findByUserGmailOrderByCreatedAtDesc(auth.getName()).stream()
                .map(n -> new NotificationDto(n.getId(), n.getTitle(), n.getMessage(),
                        n.getLink(), n.isRead(), n.getCreatedAt()))
                .toList();
    }

    @PutMapping("/api/notifications/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable Long id, Authentication auth) {
        Notification n = notifications.findById(id).orElse(null);
        if (n == null || !n.getUser().getGmail().equals(auth.getName()))
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Not found."));
        n.setRead(true);
        notifications.save(n);
        return ResponseEntity.ok(Map.of("message", "Marked as read."));
    }
}
