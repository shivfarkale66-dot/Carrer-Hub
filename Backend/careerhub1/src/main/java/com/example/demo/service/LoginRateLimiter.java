package com.example.demo.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class LoginRateLimiter {

    static final int MAX_FAILS_PER_EMAIL = 5;
    static final int MAX_FAILS_PER_IP = 30;
    static final Duration WINDOW = Duration.ofMinutes(15);
    static final Duration LOCK = Duration.ofMinutes(15);

    private static class Entry {
        int fails;
        Instant windowStart;
        Instant lockedUntil;
    }

    private final Map<String, Entry> entries = new ConcurrentHashMap<>();
    private Clock clock = Clock.systemUTC();

    void setClockForTest(Clock clock) {
        this.clock = clock;
    }

    private static String norm(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    public long secondsLocked(String email, String ip) {
        return Math.max(remaining("email:" + norm(email)), remaining("ip:" + ip));
    }

    private long remaining(String key) {
        Entry e = entries.get(key);
        if (e == null) return 0;
        Instant now = clock.instant();
        synchronized (e) {
            if (e.lockedUntil == null) return 0;
            if (!now.isBefore(e.lockedUntil)) return 0;
            return (long) Math.ceil(Duration.between(now, e.lockedUntil).toMillis() / 1000.0);
        }
    }

    public void failure(String email, String ip) {
        fail("email:" + norm(email), MAX_FAILS_PER_EMAIL);
        fail("ip:" + ip, MAX_FAILS_PER_IP);
    }

    private void fail(String key, int max) {
        Instant now = clock.instant();
        Entry e = entries.computeIfAbsent(key, k -> new Entry());
        synchronized (e) {
            boolean locked = e.lockedUntil != null && now.isBefore(e.lockedUntil);
            if (locked) return;
            if (e.windowStart == null || now.isAfter(e.windowStart.plus(WINDOW))) {
                e.fails = 0;
                e.windowStart = now;
                e.lockedUntil = null;
            }
            e.fails++;
            if (e.fails >= max) {
                e.lockedUntil = now.plus(LOCK);
            }
        }
    }

    public void success(String email) {
        entries.remove("email:" + norm(email));
    }

    @Scheduled(fixedDelay = 600_000, initialDelay = 600_000)
    public void cleanup() {
        Instant now = clock.instant();
        entries.entrySet().removeIf(en -> {
            Entry e = en.getValue();
            synchronized (e) {
                boolean lockOver = e.lockedUntil == null || !now.isBefore(e.lockedUntil);
                boolean windowOver = e.windowStart == null || now.isAfter(e.windowStart.plus(WINDOW));
                return lockOver && windowOver;
            }
        });
    }
}
