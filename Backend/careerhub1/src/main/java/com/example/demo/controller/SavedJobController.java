package com.example.demo.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.example.demo.dto.SavedJobResponse;
import com.example.demo.entity.Job;
import com.example.demo.entity.SavedJob;
import com.example.demo.entity.User;
import com.example.demo.repository.JobRepository;
import com.example.demo.repository.SavedJobRepository;
import com.example.demo.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/saved-jobs")
public class SavedJobController {

    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final SavedJobRepository savedJobRepository;

    public SavedJobController(UserRepository userRepository,
                              JobRepository jobRepository,
                              SavedJobRepository savedJobRepository) {
        this.userRepository = userRepository;
        this.jobRepository = jobRepository;
        this.savedJobRepository = savedJobRepository;
    }

    private Optional<User> currentUser(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            return Optional.empty();
        }
        return userRepository.findByGmailIgnoreCase(auth.getName());
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Please login again"));
    }

    @GetMapping
    public ResponseEntity<?> list(Authentication auth) {
        Optional<User> user = currentUser(auth);
        if (user.isEmpty()) return unauthorized();

        List<SavedJobResponse> list = savedJobRepository
                .findByUserIdOrderByIdDesc(user.get().getId())
                .stream().map(s -> SavedJobResponse.from(s.getJob())).toList();
        return ResponseEntity.ok(list);
    }

    @PutMapping("/{jobId}")
    public ResponseEntity<?> save(@PathVariable Long jobId, Authentication auth) {
        Optional<User> user = currentUser(auth);
        if (user.isEmpty()) return unauthorized();

        Optional<Job> job = jobRepository.findById(jobId);
        if (job.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Job not found"));
        }
        if (savedJobRepository.findByUserIdAndJobId(user.get().getId(), jobId).isEmpty()) {
            SavedJob s = new SavedJob();
            s.setUser(user.get());
            s.setJob(job.get());
            savedJobRepository.save(s);
        }
        return ResponseEntity.ok(Map.of("message", "Job saved"));
    }

    @DeleteMapping("/{jobId}")
    public ResponseEntity<?> remove(@PathVariable Long jobId, Authentication auth) {
        Optional<User> user = currentUser(auth);
        if (user.isEmpty()) return unauthorized();

        savedJobRepository.findByUserIdAndJobId(user.get().getId(), jobId)
                .ifPresent(savedJobRepository::delete);
        return ResponseEntity.ok(Map.of("message", "Job removed"));
    }
}
