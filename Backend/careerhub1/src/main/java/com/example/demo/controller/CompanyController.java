package com.example.demo.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.example.demo.dto.CompanyResponse;
import com.example.demo.dto.JobResponse;
import com.example.demo.entity.Company;
import com.example.demo.repository.CompanyRepository;
import com.example.demo.repository.JobRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/companies")
public class CompanyController {

    private final CompanyRepository companyRepository;
    private final JobRepository jobRepository;

    public CompanyController(CompanyRepository companyRepository, JobRepository jobRepository) {
        this.companyRepository = companyRepository;
        this.jobRepository = jobRepository;
    }

    @GetMapping
    public List<CompanyResponse> list(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "") String city) {

        return companyRepository.search(q.trim(), city.trim()).stream()
                .map(c -> CompanyResponse.from(c, jobRepository.countByCompanyId(c.getId())))
                .toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> one(@PathVariable Long id) {
        Optional<Company> c = companyRepository.findById(id);
        if (c.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Company not found"));
        }
        return ResponseEntity.ok(CompanyResponse.from(c.get(),
                jobRepository.countByCompanyId(id)));
    }

    @GetMapping("/{id}/jobs")
    public List<JobResponse> jobs(@PathVariable Long id) {
        return jobRepository.findByCompanyIdOrderByIdDesc(id).stream()
                .map(JobResponse::from)
                .toList();
    }
}
