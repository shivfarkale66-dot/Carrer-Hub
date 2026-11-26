package com.example.demo.controller;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.entity.User;
import com.example.demo.entity.UserProfile;
import com.example.demo.entity.UserResume;
import com.example.demo.repository.UserProfileRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.UserResumeRepository;

@RestController
public class ProfileController {

    public record ProfileRequest(
            String fullName, String phone, String location, String linkedin,
            String title, String headline, String about, String skills,
            String education, String experience, String photo) {}

    public record ResumeRequest(String name, String data) {}

    public record ResumeResponse(String name, String data) {}

    public record ProfileResponse(
            boolean saved,
            Long userId,
            String fullName,
            String gmail,
            String phone,
            String location,
            String linkedin,
            String title,
            String headline,
            String about,
            String skills,
            String education,
            String experience,
            String photo,
            String resumeName,
            boolean hasResume,
            LocalDateTime updatedAt) {}

    private static final int MAX_PHOTO = 600_000;
    private static final int MAX_RESUME = 1_600_000;

    private final UserRepository users;
    private final UserProfileRepository profiles;
    private final UserResumeRepository resumes;

    public ProfileController(UserRepository users,
                             UserProfileRepository profiles,
                             UserResumeRepository resumes) {
        this.users = users;
        this.profiles = profiles;
        this.resumes = resumes;
    }

    private static boolean blank(String s) {
        return s == null || s.isBlank();
    }

    private static String clean(String s) {
        return blank(s) ? null : s.trim();
    }

    private static ResponseEntity<?> msg(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("message", message));
    }

    private static String tooLong(String label, String value, int max) {
        return value != null && value.length() > max
                ? label + " is too long (maximum " + max + " characters)."
                : null;
    }

    private static String firstError(String... errors) {
        for (String e : errors) {
            if (e != null) return e;
        }
        return null;
    }

    private Optional<User> me(Authentication auth) {
        if (auth == null || auth.getName() == null) return Optional.empty();
        return users.findByGmailIgnoreCase(auth.getName());
    }

    private UserProfile profileFor(User user) {
        return profiles.findByUserId(user.getId()).orElseGet(() -> {
            UserProfile p = new UserProfile();
            p.setUser(user);
            return p;
        });
    }

    private static ProfileResponse toResponse(User user, UserProfile p) {
        if (p == null) {
            return new ProfileResponse(false, user.getId(), user.getFullName(), user.getGmail(),
                    null, null, null, null, null, null, null, null, null, null, null, false, null);
        }
        boolean hasResume = !blank(p.getResumeName());
        return new ProfileResponse(
                true,
                user.getId(),
                blank(p.getFullName()) ? user.getFullName() : p.getFullName(),
                user.getGmail(),
                p.getPhone(),
                p.getLocation(),
                p.getLinkedin(),
                p.getTitle(),
                p.getHeadline(),
                p.getAbout(),
                p.getSkills(),
                p.getEducation(),
                p.getExperience(),
                p.getPhoto(),
                p.getResumeName(),
                hasResume,
                p.getUpdatedAt());
    }

    private ResponseEntity<?> resumeOf(Long userId) {
        Optional<UserResume> r = resumes.findByUserId(userId);
        if (r.isEmpty() || blank(r.get().getData())) {
            return msg(HttpStatus.NOT_FOUND, "No resume uploaded.");
        }
        return ResponseEntity.ok(new ResumeResponse(r.get().getName(), r.get().getData()));
    }

    @GetMapping("/api/profile")
    public ResponseEntity<?> mine(Authentication auth) {
        User user = me(auth).orElse(null);
        if (user == null) return msg(HttpStatus.UNAUTHORIZED, "Please login again.");
        return ResponseEntity.ok(toResponse(user, profiles.findByUserId(user.getId()).orElse(null)));
    }

    @PutMapping("/api/profile")
    public ResponseEntity<?> save(@RequestBody ProfileRequest r, Authentication auth) {
        User user = me(auth).orElse(null);
        if (user == null) return msg(HttpStatus.UNAUTHORIZED, "Please login again.");

        String error = firstError(
                tooLong("Name", r.fullName(), 100),
                tooLong("Phone", r.phone(), 20),
                tooLong("Location", r.location(), 100),
                tooLong("LinkedIn link", r.linkedin(), 200),
                tooLong("Job title", r.title(), 100),
                tooLong("Headline", r.headline(), 300),
                tooLong("About me", r.about(), 4000),
                tooLong("Skills", r.skills(), 2000),
                tooLong("Education", r.education(), 4000),
                tooLong("Experience", r.experience(), 4000));
        if (error != null) return msg(HttpStatus.BAD_REQUEST, error);

        if (!blank(r.photo())
                && (!r.photo().startsWith("data:image/") || r.photo().length() > MAX_PHOTO)) {
            return msg(HttpStatus.BAD_REQUEST, "The photo must be a small image.");
        }

        UserProfile p = profileFor(user);
        p.setFullName(clean(r.fullName()));
        p.setPhone(clean(r.phone()));
        p.setLocation(clean(r.location()));
        p.setLinkedin(clean(r.linkedin()));
        p.setTitle(clean(r.title()));
        p.setHeadline(clean(r.headline()));
        p.setAbout(clean(r.about()));
        p.setSkills(clean(r.skills()));
        p.setEducation(clean(r.education()));
        p.setExperience(clean(r.experience()));
        p.setPhoto(clean(r.photo()));
        profiles.save(p);

        return ResponseEntity.ok(toResponse(user, p));
    }

    @PutMapping("/api/profile/resume")
    public ResponseEntity<?> uploadResume(@RequestBody ResumeRequest r, Authentication auth) {
        User user = me(auth).orElse(null);
        if (user == null) return msg(HttpStatus.UNAUTHORIZED, "Please login again.");

        if (blank(r.name()) || !r.name().toLowerCase().matches(".*\\.(pdf|doc|docx)$")) {
            return msg(HttpStatus.BAD_REQUEST, "Please upload a PDF or Word file (.pdf, .doc, .docx).");
        }
        if (blank(r.data()) || !r.data().startsWith("data:")) {
            return msg(HttpStatus.BAD_REQUEST, "The resume file is missing.");
        }
        if (r.data().length() > MAX_RESUME) {
            return msg(HttpStatus.BAD_REQUEST, "Resume is too big. Please keep it under 1 MB.");
        }

        UserProfile p = profileFor(user);
        p.setResumeName(r.name().trim());
        profiles.save(p);

        UserResume file = resumes.findByUserId(user.getId()).orElseGet(() -> {
            UserResume n = new UserResume();
            n.setUser(user);
            return n;
        });
        file.setName(r.name().trim());
        file.setData(r.data());
        resumes.save(file);

        return ResponseEntity.ok(Map.of("message", "Resume saved.", "name", file.getName()));
    }

    @GetMapping("/api/profile/resume")
    public ResponseEntity<?> myResume(Authentication auth) {
        User user = me(auth).orElse(null);
        if (user == null) return msg(HttpStatus.UNAUTHORIZED, "Please login again.");
        return resumeOf(user.getId());
    }

    @DeleteMapping("/api/profile/resume")
    public ResponseEntity<?> deleteResume(Authentication auth) {
        User user = me(auth).orElse(null);
        if (user == null) return msg(HttpStatus.UNAUTHORIZED, "Please login again.");
        resumes.findByUserId(user.getId()).ifPresent(resumes::delete);
        profiles.findByUserId(user.getId()).ifPresent(p -> {
            p.setResumeName(null);
            profiles.save(p);
        });
        return ResponseEntity.ok(Map.of("message", "Resume removed."));
    }

    @GetMapping("/api/admin/users/{userId}/profile")
    public ResponseEntity<?> profileOf(@PathVariable Long userId) {
        User user = users.findById(userId).orElse(null);
        if (user == null) return msg(HttpStatus.NOT_FOUND, "Candidate not found.");
        return ResponseEntity.ok(toResponse(user, profiles.findByUserId(userId).orElse(null)));
    }

    @GetMapping("/api/admin/users/{userId}/resume")
    public ResponseEntity<?> resumeOfUser(@PathVariable Long userId) {
        if (!users.existsById(userId)) return msg(HttpStatus.NOT_FOUND, "Candidate not found.");
        return resumeOf(userId);
    }
}
