package com.example.demo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailNotifier {

    private static final Logger log = LoggerFactory.getLogger(EmailNotifier.class);

    private final MailService mail;
    private final String frontendUrl;

    public EmailNotifier(MailService mail, @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl) {
        this.mail = mail;
        this.frontendUrl = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
    }

    @Async
    public void emailUser(String gmail, String name, String title, String message, String link) {
        if (gmail == null || gmail.isBlank()) return;
        try {
            StringBuilder body = new StringBuilder();
            body.append("Hello ").append(name == null || name.isBlank() ? "there" : name).append(",\n\n");
            body.append(message).append("\n\n");
            if (link != null && !link.isBlank()) {
                body.append("Open CareerHub: ").append(frontendUrl).append(link).append("\n\n");
            }
            body.append("- CareerHub");
            mail.send(gmail, "[CareerHub] " + title, body.toString());
        } catch (Exception e) {
            log.warn("Could not email {}: {}", gmail, e.getMessage());
        }
    }
}
