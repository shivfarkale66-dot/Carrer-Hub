package com.example.demo.service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.entity.PasswordResetToken;
import com.example.demo.entity.User;
import com.example.demo.repository.PasswordResetTokenRepository;
import com.example.demo.repository.UserRepository;

@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
    private static final int VALID_MINUTES = 15;
    private static final int MAX_ATTEMPTS = 5;
    private static final int RESEND_AFTER_SECONDS = 60;

    @Value("${app.dev.log-reset-code:false}")
    private boolean devLogCode;

    @SuppressWarnings("serial")
	public static class ResetException extends RuntimeException {
        public ResetException(String message) {
            super(message);
        }
    }

    private final UserRepository users;
    private final PasswordResetTokenRepository tokens;
    private final PasswordEncoder encoder;
    private final MailService mail;
    private final SecureRandom random = new SecureRandom();

    public PasswordResetService(UserRepository users,
                                PasswordResetTokenRepository tokens,
                                PasswordEncoder encoder,
                                MailService mail) {
        this.users = users;
        this.tokens = tokens;
        this.encoder = encoder;
        this.mail = mail;
    }

    @Transactional
    public void request(String gmail) {
        if (!devLogCode && !mail.canDeliver()) {
            throw new ResetException("Email service is not set up on the server yet. Please contact support.");
        }
        Optional<User> found = users.findByGmailIgnoreCase(gmail);
        if (found.isEmpty()) {
            return;
        }
        User user = found.get();

        PasswordResetToken token = tokens.findByGmail(user.getGmail()).orElse(null);
        if (token != null) {
            LocalDateTime created = token.getExpiresAt().minusMinutes(VALID_MINUTES);
            if (created.plusSeconds(RESEND_AFTER_SECONDS).isAfter(LocalDateTime.now())) {
                return;
            }
        } else {
            token = new PasswordResetToken();
            token.setGmail(user.getGmail());
        }

        String code = String.format("%06d", random.nextInt(1_000_000));
        token.setCodeHash(encoder.encode(code));
        token.setExpiresAt(LocalDateTime.now().plusMinutes(VALID_MINUTES));
        token.setAttempts(0);
        tokens.save(token);

        try {
            mail.send(user.getGmail(), "Your CareerHub password reset code",
                    "Hello " + user.getFullName() + ",\n\n"
                            + "Your password reset code is: " + code + "\n"
                            + "It is valid for " + VALID_MINUTES + " minutes.\n\n"
                            + "If you did not ask for this, you can ignore this email.\n\n- CareerHub");
        } catch (Exception e) {
            log.error("Could not send the reset email", e);
            if (devLogCode) {
                log.warn("DEV ONLY - reset code for {} is {}", user.getGmail(), code);
                return;
            }
            throw new ResetException("We could not send the email. Please try again later.");
        }
    }

    @Transactional(noRollbackFor = ResetException.class)
    public void reset(String gmail, String code, String newPassword) {
        if (newPassword == null || newPassword.length() < 8) {
            throw new ResetException("Password must be at least 8 characters.");
        }
        PasswordResetToken token = tokens.findByGmail(gmail).orElse(null);
        User user = users.findByGmailIgnoreCase(gmail).orElse(null);
        if (token == null || user == null || token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResetException("The code is wrong or has expired. Please ask for a new one.");
        }
        if (token.getAttempts() >= MAX_ATTEMPTS) {
            tokens.delete(token);
            throw new ResetException("Too many wrong tries. Please ask for a new code.");
        }
        if (code == null || !encoder.matches(code.trim(), token.getCodeHash())) {
            token.setAttempts(token.getAttempts() + 1);
            tokens.save(token);
            throw new ResetException("The code is wrong or has expired. Please ask for a new one.");
        }
        user.setPassword(encoder.encode(newPassword));
        users.save(user);
        tokens.delete(token);
    }
}
