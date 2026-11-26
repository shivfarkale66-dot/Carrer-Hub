package com.example.demo.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.example.demo.dto.ApplicationResponse;
import com.example.demo.entity.Job;
import com.example.demo.entity.JobApplication;
import com.example.demo.entity.ApplicationResume;
import com.example.demo.entity.User;
import com.example.demo.entity.UserResume;
import com.example.demo.repository.ApplicationResumeRepository;
import com.example.demo.repository.JobApplicationRepository;
import com.example.demo.repository.JobRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.UserResumeRepository;
import com.example.demo.service.AdminNotifier;
import com.example.demo.service.EmailNotifier;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    public record ApplyRequest(
            Long jobId,
            String fullName,
            String email,
            String phone,
            String currentCity,
            String workChoice,
            String experience,
            String currentCompany,
            String currentPackage,
            String expectedPackage,
            String noticePeriod,
            String resume,
            String coverLetter,
            String resumeData) {}

    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final JobApplicationRepository applicationRepository;
    private final AdminNotifier adminNotifier;
    private final EmailNotifier emailNotifier;
    private final UserResumeRepository userResumeRepository;
    private final ApplicationResumeRepository applicationResumeRepository;

    public ApplicationController(UserRepository userRepository,
                                 JobRepository jobRepository,
                                 JobApplicationRepository applicationRepository,
                                 AdminNotifier adminNotifier,
                                 EmailNotifier emailNotifier,
                                 UserResumeRepository userResumeRepository,
                                 ApplicationResumeRepository applicationResumeRepository) {
        this.userRepository = userRepository;
        this.jobRepository = jobRepository;
        this.applicationRepository = applicationRepository;
        this.adminNotifier = adminNotifier;
        this.emailNotifier = emailNotifier;
        this.userResumeRepository = userResumeRepository;
        this.applicationResumeRepository = applicationResumeRepository;
    }

    private Optional<User> currentUser(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            return Optional.empty();
        }
        return userRepository.findByGmailIgnoreCase(auth.getName());
    }

    private boolean blank(String s) {
        return s == null || s.isBlank();
    }

    private ResponseEntity<?> bad(String message) {
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }

    @PostMapping
    public ResponseEntity<?> apply(@RequestBody ApplyRequest req, Authentication auth) {

        Optional<User> user = currentUser(auth);
        if (user.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please login to apply"));
        }
        if (req.jobId() == null) {
            return bad("Job is required");
        }
        Optional<Job> found = jobRepository.findById(req.jobId());
        if (found.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Job not found"));
        }
        Job job = found.get();

        if (!job.isActive()) {
            return bad("This job is closed. You can no longer apply.");
        }

        if (blank(req.phone()) || !req.phone().trim().matches("\\d{10}")) {
            return bad("Enter a valid 10 digit phone number.");
        }
        if (blank(req.experience()) || blank(req.expectedPackage()) || blank(req.noticePeriod())) {
            return bad("Please answer all the questions.");
        }
        if (blank(req.resume())) {
            return bad("Please upload your resume.");
        }

        String resumeName = req.resume().trim();
        String resumeData = req.resumeData();
        if (blank(resumeData)) {
            UserResume saved = userResumeRepository.findByUserId(user.get().getId()).orElse(null);
            if (saved == null || blank(saved.getData())) {
                return bad("Please upload your resume.");
            }
            resumeName = saved.getName();
            resumeData = saved.getData();
        } else if (!resumeName.toLowerCase().matches(".*\\.(pdf|doc|docx)$")) {
            return bad("Please upload a PDF or Word file (.pdf, .doc, .docx).");
        } else if (!resumeData.startsWith("data:") || resumeData.length() > 1_600_000) {
            return bad("The resume is not valid or too big. Please keep it under 1 MB.");
        }

        boolean remote = "Remote".equalsIgnoreCase(job.getWorkMode());
        String city = job.getCompany().getCity();
        if (!remote) {
            if (blank(req.workChoice())) {
                return bad("Please tell us if you can work in " + city + ".");
            }
            if ("no".equalsIgnoreCase(req.workChoice())) {
                return bad("This job is on-site in " + city
                        + ". You can only apply if you can work in " + city + ".");
            }
        }

        if (applicationRepository.existsByUserIdAndJobIdAndStatusNot(
                user.get().getId(), job.getId(), "Cancelled")) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "You have already applied for this job."));
        }

        JobApplication app = new JobApplication();
        app.setUser(user.get());
        app.setJob(job);
        app.setFullName(req.fullName());
        app.setEmail(req.email());
        app.setPhone(req.phone().trim());
        app.setCurrentCity(req.currentCity());
        app.setWorkChoice(remote ? "remote" : req.workChoice());
        app.setExperience(req.experience());
        app.setCurrentCompany(req.currentCompany());
        app.setCurrentPackage(req.currentPackage());
        app.setExpectedPackage(req.expectedPackage().trim());
        app.setNoticePeriod(req.noticePeriod());
        app.setResumeName(resumeName);
        app.setCoverLetter(req.coverLetter());
        app.setStatus("Applied");
        applicationRepository.save(app);

        ApplicationResume copy = new ApplicationResume();
        copy.setApplication(app);
        copy.setName(resumeName);
        copy.setData(resumeData);
        applicationResumeRepository.save(copy);

        String who = blank(req.fullName()) ? user.get().getFullName() : req.fullName();
        adminNotifier.notifyAdmins(
                "New application",
                who + " applied for " + job.getTitle() + " at " + job.getCompany().getName() + ".",
                "/admin/applications");

        emailNotifier.emailUser(user.get().getGmail(), user.get().getFullName(),
                "Application received",
                "We received your application for " + job.getTitle() + " at " + job.getCompany().getName()
                        + ". The recruiter will review it and you will get an email when the status changes.",
                "/dashboard?tab=applied");

        return ResponseEntity.status(HttpStatus.CREATED).body(ApplicationResponse.from(app));
    }

    @GetMapping("/me")
    public ResponseEntity<?> mine(Authentication auth) {
        Optional<User> user = currentUser(auth);
        if (user.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please login again"));
        }
        List<ApplicationResponse> list = applicationRepository
                .findByUserIdOrderByAppliedAtDesc(user.get().getId())
                .stream().map(ApplicationResponse::from).toList();
        return ResponseEntity.ok(list);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> withdraw(@PathVariable Long id, Authentication auth) {
        Optional<User> user = currentUser(auth);
        if (user.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please login again"));
        }
        Optional<JobApplication> found = applicationRepository.findById(id);
        if (found.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Application not found"));
        }
        JobApplication app = found.get();
        if (!app.getUser().getId().equals(user.get().getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Not allowed"));
        }
        if ("Cancelled".equalsIgnoreCase(app.getStatus())) {
            return ResponseEntity.ok(Map.of("message", "Application already cancelled"));
        }
        if ("Rejected".equalsIgnoreCase(app.getStatus())) {
            return bad("A rejected application cannot be cancelled.");
        }
        app.setStatus("Cancelled");
        applicationRepository.save(app);

        adminNotifier.notifyAdmins(
                "Application cancelled",
                app.getUser().getFullName() + " cancelled the application for "
                        + app.getJob().getTitle() + " at " + app.getJob().getCompany().getName() + ".",
                "/admin/applications");
        return ResponseEntity.ok(Map.of("message", "Application cancelled"));
    }
}
