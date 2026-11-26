package com.example.demo.service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.entity.EmailVerificationToken;
import com.example.demo.entity.User;
import com.example.demo.repository.EmailVerificationTokenRepository;
import com.example.demo.repository.UserRepository;

@Service
public class EmailVerificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailVerificationService.class);
    private static final int VALID_MINUTES = 10;
    private static final int MAX_ATTEMPTS = 5;
    private static final int RESEND_AFTER_SECONDS = 60;

    public static class VerificationException extends RuntimeException {
        public VerificationException(String message) {
            super(message);
        }
    }

    private final UserRepository users;
    private final EmailVerificationTokenRepository tokens;
    private final PasswordEncoder encoder;
    private final MailService mail;
    private final SecureRandom random = new SecureRandom();

    public EmailVerificationService(UserRepository users,
                                    EmailVerificationTokenRepository tokens,
                                    PasswordEncoder encoder,
                                    MailService mail) {
        this.users = users;
        this.tokens = tokens;
        this.encoder = encoder;
        this.mail = mail;
    }

    @Transactional
    public boolean sendCode(User user) {
        EmailVerificationToken token = tokens.findByGmail(user.getGmail()).orElse(null);
        if (token != null) {
            LocalDateTime created = token.getExpiresAt().minusMinutes(VALID_MINUTES);
            if (created.plusSeconds(RESEND_AFTER_SECONDS).isAfter(LocalDateTime.now())) {
                return false;
            }
        } else {
            token = new EmailVerificationToken();
            token.setGmail(user.getGmail());
        }

        String code = String.format("%06d", random.nextInt(1_000_000));
        token.setCodeHash(encoder.encode(code));
        token.setExpiresAt(LocalDateTime.now().plusMinutes(VALID_MINUTES));
        token.setAttempts(0);
        tokens.save(token);

        try {
            mail.send(user.getGmail(), "Your CareerHub verification code",
                    "Hello " + user.getFullName() + ",\n\n"
                            + "Welcome to CareerHub! Your verification code is: " + code + "\n"
                            + "It is valid for " + VALID_MINUTES + " minutes.\n\n"
                            + "If you did not create this account, you can ignore this email.\n\n- CareerHub");
        } catch (Exception e) {
            log.error("Could not send the verification email", e);
            throw new VerificationException("We could not send the email. Please try again in a moment.");
        }
        return true;
    }

    @Transactional(noRollbackFor = VerificationException.class)
    public void verify(String gmail, String code) {
        User user = users.findByGmailIgnoreCase(gmail).orElse(null);
        if (user == null) {
            throw new VerificationException("The code is wrong or has expired. Please ask for a new one.");
        }
        if (user.isEmailVerified()) {
            return;
        }

        EmailVerificationToken token = tokens.findByGmail(user.getGmail()).orElse(null);
        if (token == null || token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new VerificationException("The code is wrong or has expired. Please ask for a new one.");
        }
        if (token.getAttempts() >= MAX_ATTEMPTS) {
            tokens.delete(token);
            throw new VerificationException("Too many wrong tries. Please ask for a new code.");
        }
        if (code == null || !encoder.matches(code.trim(), token.getCodeHash())) {
            token.setAttempts(token.getAttempts() + 1);
            tokens.save(token);
            throw new VerificationException("The code is wrong or has expired. Please ask for a new one.");
        }

        user.setEmailVerified(true);
        users.save(user);
        tokens.delete(token);
    }
}
