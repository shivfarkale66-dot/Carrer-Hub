package com.example.demo.controller;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.SignupRequest;
import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtService;
import com.example.demo.service.EmailVerificationService;
import com.example.demo.service.LoginRateLimiter;
import com.example.demo.service.MailService;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailVerificationService verificationService;
    private final MailService mailService;
    private final LoginRateLimiter rateLimiter;

    public AuthController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            EmailVerificationService verificationService,
            MailService mailService,
            LoginRateLimiter rateLimiter) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.verificationService = verificationService;
        this.mailService = mailService;
        this.rateLimiter = rateLimiter;
    }

    private static String clientIp(HttpServletRequest http) {
        String forwarded = http.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return http.getRemoteAddr();
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request) {

        if (request.getFullName() == null || request.getFullName().isBlank()
                || request.getGmail() == null || request.getGmail().isBlank()
                || request.getPassword() == null || request.getPassword().isBlank()
                || request.getConfirmPassword() == null
                || request.getConfirmPassword().isBlank()) {

            return ResponseEntity.badRequest()
                    .body(Map.of("message", "All fields are required"));
        }

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Passwords do not match"));
        }

        String gmail = request.getGmail().trim().toLowerCase();

        if (!gmail.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$") || gmail.length() > 200) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Please enter a valid email address"));
        }

        if (request.getFullName().trim().length() > 100) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Name is too long"));
        }

        if (request.getPassword().length() < 8) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Password must be at least 8 characters"));
        }

        if (!mailService.canDeliver()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("message",
                            "Email service is not set up on the server yet. Please contact support."));
        }

        Optional<User> existing = userRepository.findByGmailIgnoreCase(gmail);
        User user;

        if (existing.isPresent()) {
            user = existing.get();
            if (user.isEmailVerified()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("message", "Email already registered"));
            }

            user.setCreatedAt(java.time.LocalDateTime.now());
        } else {
            user = new User();
            user.setGmail(gmail);
            user.setRole("USER");
            user.setEmailVerified(false);
        }

        user.setFullName(request.getFullName().trim());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        userRepository.save(user);

        try {
            verificationService.sendCode(user);
        } catch (EmailVerificationService.VerificationException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("message", e.getMessage()));
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "We sent a 6 digit code to " + gmail,
                "verificationRequired", true,
                "email", gmail));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletRequest http) {

        if (request.getGmail() == null || request.getGmail().isBlank()
                || request.getPassword() == null
                || request.getPassword().isBlank()) {

            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Email and password are required"));
        }

        String ip = clientIp(http);

        long wait = rateLimiter.secondsLocked(request.getGmail(), ip);
        if (wait > 0) {
            long minutes = (wait + 59) / 60;
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("message", "Too many failed attempts. Please try again in "
                            + minutes + (minutes == 1 ? " minute." : " minutes.")));
        }

        Optional<User> found = userRepository.findByGmailIgnoreCase(
                request.getGmail().trim());

        if (found.isEmpty()
                || !passwordEncoder.matches(
                        request.getPassword(), found.get().getPassword())) {

            rateLimiter.failure(request.getGmail(), ip);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid email or password"));
        }

        rateLimiter.success(request.getGmail());
        User user = found.get();

        if (!user.isEmailVerified()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "message", "Please verify your email first.",
                    "needsVerification", true,
                    "email", user.getGmail()));
        }

        String role = user.getRole()
                .replace("ROLE_", "").toUpperCase();

        Map<String, Object> userData = new LinkedHashMap<>();

        userData.put("id", user.getId());
        userData.put("fullName", user.getFullName());
        userData.put("gmail", user.getGmail());
        userData.put("role", role);

        return ResponseEntity.ok(Map.of(
                "message", "Login successful",
                "token", jwtService.generateToken(user.getGmail(), role),
                "user", userData
        ));
    }
}
