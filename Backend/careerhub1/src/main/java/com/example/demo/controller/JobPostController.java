package com.example.demo.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.entity.JobPost;
import com.example.demo.repository.JobPostRepository;

@RestController
public class JobPostController {

    public record JobPostRequest(
            String title, String companyName, String location, String jobType,
            String experience, String salary, String category, String description) {}

    private final JobPostRepository repo;

    public JobPostController(JobPostRepository repo) {
        this.repo = repo;
    }

    private static boolean blank(String s) {
        return s == null || s.isBlank();
    }

    private static String clean(String s) {
        return blank(s) ? null : s.trim();
    }

    private static String validate(JobPostRequest r) {
        if (blank(r.title())) return "Job title is required.";
        if (blank(r.companyName())) return "Company name is required.";
        if (blank(r.location())) return "Location is required.";
        return null;
    }

    private static void apply(JobPost j, JobPostRequest r) {
        j.setTitle(r.title().trim());
        j.setCompanyName(r.companyName().trim());
        j.setLocation(r.location().trim());
        j.setJobType(clean(r.jobType()));
        j.setExperience(clean(r.experience()));
        j.setSalary(clean(r.salary()));
        j.setCategory(clean(r.category()));
        j.setDescription(clean(r.description()));
    }

    @GetMapping("/api/job-posts")
    public List<JobPost> publicList() {
        return repo.findAllByOrderByCreatedAtDesc();
    }

    @GetMapping("/api/admin/job-posts")
    public List<JobPost> adminList() {
        return repo.findAllByOrderByCreatedAtDesc();
    }

    @PostMapping("/api/admin/job-posts")
    public ResponseEntity<?> create(@RequestBody JobPostRequest r) {
        String error = validate(r);
        if (error != null) return ResponseEntity.badRequest().body(Map.of("message", error));
        JobPost j = new JobPost();
        apply(j, r);
        return ResponseEntity.ok(repo.save(j));
    }

    @PutMapping("/api/admin/job-posts/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody JobPostRequest r) {
        String error = validate(r);
        if (error != null) return ResponseEntity.badRequest().body(Map.of("message", error));
        JobPost j = repo.findById(id).orElse(null);
        if (j == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Job not found."));
        apply(j, r);
        return ResponseEntity.ok(repo.save(j));
    }

    @DeleteMapping("/api/admin/job-posts/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!repo.existsById(id))
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Job not found."));
        repo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Job deleted."));
    }
}
