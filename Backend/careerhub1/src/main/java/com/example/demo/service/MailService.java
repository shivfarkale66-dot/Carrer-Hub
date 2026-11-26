package com.example.demo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final ObjectProvider<JavaMailSender> senderProvider;
    private final String host;
    private final String username;
    private final String from;
    private final boolean devLog;

    public MailService(ObjectProvider<JavaMailSender> senderProvider,
                       @Value("${spring.mail.host:}") String host,
                       @Value("${spring.mail.username:}") String username,
                       @Value("${app.mail.from:}") String from,
                       @Value("${app.mail.dev-log:true}") boolean devLog) {
        this.senderProvider = senderProvider;
        this.host = host;
        this.username = username;
        this.from = from;
        this.devLog = devLog;
    }

    private boolean smtpConfigured() {
        return host != null && !host.isBlank();
    }

    public boolean canDeliver() {
        return smtpConfigured() || devLog;
    }

    public void send(String to, String subject, String body) {
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
