package com.example.demo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final ObjectProvider<JavaMailSender> senderProvider;
    private final String host;
    private final String username;
    private final String from;
    private final boolean devLog;
    private final String brevoApiKey;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    public MailService(ObjectProvider<JavaMailSender> senderProvider,
                       @Value("${spring.mail.host:}") String host,
                       @Value("${spring.mail.username:}") String username,
                       @Value("${app.mail.from:}") String from,
                       @Value("${app.mail.dev-log:true}") boolean devLog,
                       @Value("${app.mail.brevo-api-key:}") String brevoApiKey) {
        this.senderProvider = senderProvider;
        this.host = host;
        this.username = username;
        this.from = from;
        this.devLog = devLog;
        this.brevoApiKey = brevoApiKey;
    }

    private boolean apiConfigured() {
        return brevoApiKey != null && !brevoApiKey.isBlank();
    }

    private static String json(String s) {
        StringBuilder b = new StringBuilder("\"");
        for (char c : s.toCharArray()) {
            switch (c) {
                case '"' -> b.append("\\\"");
                case '\\' -> b.append("\\\\");
                case '\n' -> b.append("\\n");
                case '\r' -> b.append("\\r");
                case '\t' -> b.append("\\t");
                default -> {
                    if (c < 0x20) {
                        b.append(String.format("\\u%04x", (int) c));
                    } else {
                        b.append(c);
                    }
                }
            }
        }
        return b.append('"').toString();
    }

    private void sendViaApi(String to, String subject, String body) {
        String sender = (from != null && !from.isBlank()) ? from : username;
        if (sender == null || sender.isBlank()) {
            throw new IllegalStateException("MAIL_FROM is required when BREVO_API_KEY is set.");
        }
        String payload = "{\"sender\":{\"name\":\"CareerHub\",\"email\":" + json(sender) + "},"
                + "\"to\":[{\"email\":" + json(to) + "}],"
                + "\"subject\":" + json(subject) + ","
                + "\"textContent\":" + json(body) + "}";
        try {
            HttpRequest req = HttpRequest.newBuilder(URI.create("https://api.brevo.com/v3/smtp/email"))
                    .timeout(Duration.ofSeconds(15))
                    .header("api-key", brevoApiKey.trim())
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();
            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() / 100 != 2) {
                log.error("Brevo mail failed: HTTP {} {}", res.statusCode(), res.body());
                throw new IllegalStateException("Mail API returned HTTP " + res.statusCode());
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Mail sending interrupted", e);
        } catch (java.io.IOException e) {
            log.error("Brevo mail failed: {}", e.getMessage());
            throw new IllegalStateException("Mail API unreachable", e);
        }
    }

    private boolean smtpConfigured() {
        return host != null && !host.isBlank();
    }

    public boolean canDeliver() {
        return apiConfigured() || smtpConfigured() || devLog;
    }

    public void send(String to, String subject, String body) {
        if (apiConfigured()) {
            sendViaApi(to, subject, body);
            return;
        }
        if (!smtpConfigured()) {
            if (devLog) {
                log.warn("[MAIL not configured - printing instead]\n  To: {}\n  Subject: {}\n  {}", to, subject, body);
            }
            return;
        }
        JavaMailSender sender = senderProvider.getIfAvailable();
        if (sender == null) {
            log.error("MAIL_HOST is set but no mail sender is available.");
            return;
        }
        SimpleMailMessage m = new SimpleMailMessage();
        m.setTo(to);
        m.setSubject(subject);
        m.setText(body);
        if (from != null && !from.isBlank()) {
            m.setFrom(from);
        } else if (username != null && !username.isBlank()) {
            m.setFrom(username);
        }
        sender.send(m);
    }
}
