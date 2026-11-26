package com.example.demo.service;

import org.springframework.stereotype.Service;

import com.example.demo.entity.Notification;
import com.example.demo.entity.User;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.UserRepository;

@Service
public class AdminNotifier {

    private final UserRepository users;
    private final NotificationRepository notifications;
    private final EmailNotifier emailNotifier;

    public AdminNotifier(UserRepository users, NotificationRepository notifications, EmailNotifier emailNotifier) {
        this.users = users;
        this.notifications = notifications;
        this.emailNotifier = emailNotifier;
    }

    public void notifyAdmins(String title, String message, String link) {
        try {
            for (User u : users.findAll()) {
                String role = String.valueOf(u.getRole()).replace("ROLE_", "").toUpperCase();
                if (!"ADMIN".equals(role)) continue;

                Notification n = new Notification();
                n.setUser(u);
                n.setTitle(title);
                n.setMessage(message);
                n.setLink(link);
                notifications.save(n);
                emailNotifier.emailUser(u.getGmail(), u.getFullName(), title, message, link);
            }
        } catch (Exception e) {

        }
    }
}
