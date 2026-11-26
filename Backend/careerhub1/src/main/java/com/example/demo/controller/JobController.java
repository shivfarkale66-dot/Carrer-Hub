package com.example.demo.controller;

import java.util.Map;
import java.util.Optional;

import com.example.demo.dto.JobResponse;
import com.example.demo.entity.Job;
import com.example.demo.repository.JobRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    private final JobRepository jobRepository;

    public JobController(JobRepository jobRepository) {
        this.jobRepository = jobRepository;
    }

    @GetMapping
    public Map<String, Object> list(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "") String city,
            @RequestParam(defaultValue = "") String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {

        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), 50),
                Sort.by(Sort.Direction.DESC, "id"));

        Page<Job> result = jobRepository.search(q.trim(), city.trim(), type.trim(), pageable);

        return Map.of(
                "jobs", result.getContent().stream().map(JobResponse::from).toList(),
                "page", result.getNumber(),
                "totalPages", Math.max(result.getTotalPages(), 1),
                "totalElements", result.getTotalElements());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> one(@PathVariable Long id) {
        Optional<Job> job = jobRepository.findById(id);
        if (job.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Job not found"));
        }
        return ResponseEntity.ok(JobResponse.from(job.get()));
    }
}
