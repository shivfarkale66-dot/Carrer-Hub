package com.example.demo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.example.demo.entity.Notification;
import com.example.demo.entity.User;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.UserRepository;

@Service
public class JobAlertService {

    private static final Logger log = LoggerFactory.getLogger(JobAlertService.class);

    private final UserRepository users;
    private final NotificationRepository notifications;
    private final EmailNotifier emailNotifier;

    public JobAlertService(UserRepository users,
                           NotificationRepository notifications,
                           EmailNotifier emailNotifier) {
        this.users = users;
        this.notifications = notifications;
        this.emailNotifier = emailNotifier;
    }

    @Async
    public void newJob(String title, String company, String location, String pay, String type) {
        String message = title + " at " + company
                + (location == null || location.isBlank() ? "" : " (" + location + ")")
                + " was just posted."
                + (pay == null || pay.isBlank() ? "" : " Pay: " + pay + ".")
                + (type == null || type.isBlank() ? "" : " Type: " + type + ".");
        String heading = "New job: " + title;

        int sent = 0;
        for (User u : users.findAll()) {
            try {
                String role = u.getRole() == null ? "" : u.getRole().replace("ROLE_", "").toUpperCase();
                if (!"USER".equals(role) || !u.isJobAlerts() || !u.isEmailVerified()) continue;

                Notification n = new Notification();
                n.setUser(u);
                n.setTitle(heading);
                n.setMessage(message);
                n.setLink("/jobs");
                notifications.save(n);

                emailNotifier.emailUser(u.getGmail(), u.getFullName(), heading, message, "/jobs");
                sent++;
            } catch (Exception e) {
                log.warn("Job alert failed for {}: {}", u.getGmail(), e.getMessage());
            }
        }
        log.info("Job alert '{}' sent to {} candidates", title, sent);
    }
}
