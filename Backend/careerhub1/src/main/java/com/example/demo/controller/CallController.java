package com.example.demo.controller;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.example.demo.entity.Interview;
import com.example.demo.repository.InterviewRepository;

@RestController
@RequestMapping("/api/interviews/{id}/call")
public class CallController {

    public record SignalRequest(String type, String sid, String to, String data) {}

    public record SignalMessage(long id, String from, String type, String sid, String to, String data) {}

    public record CallInfo(
            Long id,
            String role,
            String jobTitle,
            String companyName,
            String mode,
            LocalDateTime scheduledAt,
            Integer durationMinutes,
            String candidateName,
            String otherName,
            boolean canJoin,
            String reason) {}

    private record Access(Interview interview, String role) {}

    private static final class CallException extends RuntimeException {
        private final HttpStatus status;

        CallException(HttpStatus status, String message) {
            super(message);
            this.status = status;
        }
    }

    private static final class Room {
        private final AtomicLong seq = new AtomicLong();
        private final List<SignalMessage> messages = new ArrayList<>();
        private volatile long touched = System.currentTimeMillis();
    }

    private static final List<String> TYPES = List.of("join", "offer", "answer", "candidate", "leave");
    private static final int MAX_DATA = 30_000;
    private static final int MAX_MESSAGES = 600;
    private static final DateTimeFormatter WHEN =
            DateTimeFormatter.ofPattern("d MMM yyyy, h:mm a", Locale.ENGLISH);

    private final InterviewRepository interviews;
    private final ConcurrentHashMap<Long, Room> rooms = new ConcurrentHashMap<>();

    public CallController(InterviewRepository interviews) {
        this.interviews = interviews;
    }

    @ExceptionHandler(CallException.class)
    public ResponseEntity<?> onError(CallException e) {
        return ResponseEntity.status(e.status).body(Map.of("message", e.getMessage()));
    }

    private Access access(Long id, Authentication auth) {
        Interview iv = interviews.findById(id)
                .orElseThrow(() -> new CallException(HttpStatus.NOT_FOUND, "Interview not found."));
        boolean admin = auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()) || "ADMIN".equals(a.getAuthority()));
        if (admin) return new Access(iv, "recruiter");
        if (iv.getUser().getGmail().equalsIgnoreCase(auth.getName())) return new Access(iv, "candidate");

        throw new CallException(HttpStatus.NOT_FOUND, "Interview not found.");
    }

    private String blockReason(Interview iv) {
        if (iv.getStatus() == Interview.Status.CANCELLED) return "This interview was cancelled.";
        if (iv.getStatus() == Interview.Status.COMPLETED) return "This interview is already completed.";
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = iv.getScheduledAt();
        int minutes = iv.getDurationMinutes() == null ? 30 : iv.getDurationMinutes();
        if (now.isBefore(start.minusMinutes(15))) {
            return "The call opens 15 minutes before the start time (" + start.format(WHEN) + ").";
        }
        if (now.isAfter(start.plusMinutes(minutes + 60L))) {
            return "The time for this interview is over.";
        }
        return null;
    }

    private Room room(Long id) {
        return rooms.computeIfAbsent(id, k -> new Room());
    }

    private void cleanup() {
        long cutoff = System.currentTimeMillis() - 3L * 60 * 60 * 1000;
        rooms.values().removeIf(r -> r.touched < cutoff);
    }

    @GetMapping
    public CallInfo info(@PathVariable Long id, Authentication auth) {
        Access a = access(id, auth);
        Interview iv = a.interview();
        String reason = blockReason(iv);
        String candidate = iv.getUser().getFullName();
        return new CallInfo(
                iv.getId(),
                a.role(),
                iv.getJobTitle(),
                iv.getCompanyName(),
                iv.getMode() == null ? "VIDEO" : iv.getMode().name(),
                iv.getScheduledAt(),
                iv.getDurationMinutes(),
                candidate,
                "recruiter".equals(a.role()) ? candidate : "Recruiter",
                reason == null,
                reason);
    }

    @PostMapping("/signal")
    public ResponseEntity<?> send(@PathVariable Long id, @RequestBody SignalRequest r, Authentication auth) {
        Access a = access(id, auth);

        String type = r.type() == null ? "" : r.type().trim();
        if (!TYPES.contains(type)) throw new CallException(HttpStatus.BAD_REQUEST, "Unknown message type.");
        if (r.sid() == null || r.sid().isBlank() || r.sid().length() > 100) {
            throw new CallException(HttpStatus.BAD_REQUEST, "Session id is required.");
        }
        if (r.data() != null && r.data().length() > MAX_DATA) {
            throw new CallException(HttpStatus.BAD_REQUEST, "Message is too large.");
        }
        if ("join".equals(type)) {
            String reason = blockReason(a.interview());
            if (reason != null) throw new CallException(HttpStatus.CONFLICT, reason);
            cleanup();
        }

        Room room = room(id);
        synchronized (room) {
            if ("join".equals(type)) {

                room.messages.removeIf(m -> m.from().equals(a.role()));
            } else if ("leave".equals(type)) {

                room.messages.removeIf(m -> m.from().equals(a.role()) && m.sid().equals(r.sid()));
            }
            if (room.messages.size() >= MAX_MESSAGES) {
                room.messages.subList(0, 100).clear();
            }
            room.messages.add(new SignalMessage(
                    room.seq.incrementAndGet(), a.role(), type, r.sid(),
                    r.to() == null || r.to().isBlank() ? null : r.to(), r.data()));
            room.touched = System.currentTimeMillis();
        }
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @GetMapping("/signal")
    public ResponseEntity<?> poll(@PathVariable Long id,
                                  @RequestParam(defaultValue = "0") long after,
                                  Authentication auth) {
        Access a = access(id, auth);
        Room room = rooms.get(id);
        if (room == null) return ResponseEntity.ok(List.of());
        synchronized (room) {
            room.touched = System.currentTimeMillis();
            List<SignalMessage> out = room.messages.stream()
                    .filter(m -> m.id() > after && !m.from().equals(a.role()))
                    .toList();
            return ResponseEntity.ok(out);
        }
    }
}
