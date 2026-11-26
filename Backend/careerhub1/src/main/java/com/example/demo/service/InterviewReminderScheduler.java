package com.example.demo.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.example.demo.entity.Interview;
import com.example.demo.entity.Notification;
import com.example.demo.entity.User;
import com.example.demo.repository.InterviewRepository;
import com.example.demo.repository.NotificationRepository;

@Component
public class InterviewReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(InterviewReminderScheduler.class);
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("d MMM, h:mm a", Locale.ENGLISH);
    private static final String LINK = "/my-interviews";

    private final InterviewRepository interviews;
    private final NotificationRepository notifications;
    private final EmailNotifier emailNotifier;
    private final AdminNotifier adminNotifier;

    public InterviewReminderScheduler(InterviewRepository interviews,
                                      NotificationRepository notifications,
                                      EmailNotifier emailNotifier,
                                      AdminNotifier adminNotifier) {
        this.interviews = interviews;
        this.notifications = notifications;
        this.emailNotifier = emailNotifier;
        this.adminNotifier = adminNotifier;
    }

    static String dueReminder(long minutesLeft, boolean sent1h, boolean sent10m) {
        if (minutesLeft < 0) return null;
        if (minutesLeft <= 10) return sent10m ? null : "10m";
        if (minutesLeft <= 60) return sent1h ? null : "1h";
        return null;
    }

    @Scheduled(fixedDelay = 60_000, initialDelay = 30_000)
    public void sendReminders() {
        LocalDateTime now = LocalDateTime.now();
        List<Interview> soon;
        try {
            soon = interviews.findByStatusAndScheduledAtBetween(
                    Interview.Status.SCHEDULED, now, now.plusMinutes(61));
        } catch (Exception e) {
            log.warn("Reminder check failed: {}", e.getMessage());
            return;
        }

        for (Interview i : soon) {
            try {
                long minutes = Duration.between(now, i.getScheduledAt()).toMinutes();
                String due = dueReminder(minutes, i.isReminder1hSent(), i.isReminder10mSent());
                if (due == null) continue;

                User user = i.getUser();
                String when = i.getScheduledAt().format(TIME);
                String what = i.getJobTitle() + (i.getCompanyName() == null ? "" : " at " + i.getCompanyName());

                String title = "10m".equals(due) ? "Interview starts in 10 minutes" : "Interview in about 1 hour";
                String message = "Your interview for " + what + " starts at " + when
                        + ". Open My Interviews and press Join when it is time.";

                Notification n = new Notification();
                n.setUser(user);
                n.setTitle(title);
                n.setMessage(message);
                n.setLink(LINK);
                notifications.save(n);
                emailNotifier.emailUser(user.getGmail(), user.getFullName(), title, message, LINK);

                if ("1h".equals(due)) {
                    adminNotifier.notifyAdmins("Interview in about 1 hour",
                            user.getFullName() + " - " + what + " at " + when, "/admin");
                    i.setReminder1hSent(true);
                } else {
                    i.setReminder1hSent(true);
                    i.setReminder10mSent(true);
                }
                interviews.save(i);
            } catch (Exception e) {
                log.warn("Reminder for interview {} failed: {}", i.getId(), e.getMessage());
            }
        }
    }
}
