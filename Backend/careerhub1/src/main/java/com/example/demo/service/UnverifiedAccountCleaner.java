package com.example.demo.service;

import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.entity.User;
import com.example.demo.repository.EmailVerificationTokenRepository;
import com.example.demo.repository.UserRepository;

@Component
public class UnverifiedAccountCleaner {

    private static final Logger log = LoggerFactory.getLogger(UnverifiedAccountCleaner.class);
    private static final int KEEP_HOURS = 24;

    private final UserRepository users;
    private final EmailVerificationTokenRepository tokens;

    public UnverifiedAccountCleaner(UserRepository users, EmailVerificationTokenRepository tokens) {
        this.users = users;
        this.tokens = tokens;
    }

    @Scheduled(fixedDelay = 3_600_000, initialDelay = 120_000)
    @Transactional
    public void removeOldUnverified() {
        try {
            List<User> old = users.findUnverifiedBefore(LocalDateTime.now().minusHours(KEEP_HOURS));
            for (User u : old) {
                tokens.findByGmail(u.getGmail()).ifPresent(tokens::delete);
                users.delete(u);
            }
            if (!old.isEmpty()) {
                log.info("Removed {} unverified accounts older than {} hours", old.size(), KEEP_HOURS);
            }
        } catch (Exception e) {
            log.warn("Cleanup of unverified accounts failed: {}", e.getMessage());
        }
    }
}
