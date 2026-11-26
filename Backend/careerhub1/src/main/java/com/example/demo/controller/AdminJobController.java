package com.example.demo.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import com.example.demo.dto.JobResponse;
import com.example.demo.entity.Company;
import com.example.demo.entity.Job;
import com.example.demo.repository.CompanyRepository;
import com.example.demo.repository.JobApplicationRepository;
import com.example.demo.repository.JobRepository;
import com.example.demo.service.JobAlertService;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/jobs")
public class AdminJobController {

    public record JobRequest(
            String title, String companyName, String city, String area,
            String category, String type, String pay, String exp,
            String workMode, Double lpa, String description) {}

    public record ActiveRequest(Boolean active) {}

    private final JobRepository jobs;
    private final CompanyRepository companies;
    private final JobApplicationRepository applications;
    private final JobAlertService jobAlerts;

    public AdminJobController(JobRepository jobs,
                              CompanyRepository companies,
                              JobApplicationRepository applications,
                              JobAlertService jobAlerts) {
        this.jobs = jobs;
        this.companies = companies;
        this.applications = applications;
        this.jobAlerts = jobAlerts;
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

    private static String validate(JobRequest r) {
        if (blank(r.title())) return "Job title is required.";
        if (blank(r.companyName())) return "Company name is required.";
        if (blank(r.type())) return "Job type is required.";
        if (r.lpa() == null || r.lpa() < 0)
            return "Salary in LPA (a number) is required. It is used by the salary filter.";
        return null;
    }

    private Company resolveCompany(JobRequest r) {
        String name = r.companyName().trim();
        Company c = companies.findByNameIgnoreCase(name).orElse(null);
        if (c == null) {
            c = new Company();
            c.setName(name);
        }
        if (!blank(r.city())) c.setCity(r.city().trim());
        if (!blank(r.area())) c.setArea(r.area().trim());
        if (blank(c.getCity())) {
            throw new IllegalArgumentException("City is required for a new company.");
        }
        return companies.save(c);
    }

    private void apply(Job j, JobRequest r, Company c) {
        j.setTitle(r.title().trim());
        j.setCompany(c);
        j.setCategory(clean(r.category()));
        j.setJobType(r.type().trim());
        j.setSalary(clean(r.pay()));
        j.setExperience(clean(r.exp()));
        j.setWorkMode(blank(r.workMode()) ? "On-site" : r.workMode().trim());
        j.setLpa(r.lpa());
        j.setDescription(clean(r.description()));
    }

    @GetMapping
    public List<JobResponse> all() {
        return jobs.findAllByOrderByIdDesc().stream().map(JobResponse::from).toList();
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody JobRequest r) {
        String error = validate(r);
        if (error != null) return msg(HttpStatus.BAD_REQUEST, error);
        try {
            Company c = resolveCompany(r);
            Job j = new Job();
            apply(j, r, c);
            j.setPostedAt(LocalDate.now());
            j.setActive(true);
            Job saved = jobs.save(j);

            String where = blank(c.getArea()) ? c.getCity() : c.getArea() + ", " + c.getCity();
            jobAlerts.newJob(saved.getTitle(), c.getName(), where, saved.getSalary(), saved.getJobType());

            return ResponseEntity.status(HttpStatus.CREATED).body(JobResponse.from(saved));
        } catch (IllegalArgumentException e) {
            return msg(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody JobRequest r) {
        String error = validate(r);
        if (error != null) return msg(HttpStatus.BAD_REQUEST, error);
        Job j = jobs.findById(id).orElse(null);
        if (j == null) return msg(HttpStatus.NOT_FOUND, "Job not found.");
        try {
            Company c = resolveCompany(r);
            apply(j, r, c);
            return ResponseEntity.ok(JobResponse.from(jobs.save(j)));
        } catch (IllegalArgumentException e) {
            return msg(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PutMapping("/{id}/active")
    public ResponseEntity<?> setActive(@PathVariable Long id, @RequestBody ActiveRequest r) {
        Job j = jobs.findById(id).orElse(null);
        if (j == null) return msg(HttpStatus.NOT_FOUND, "Job not found.");
        if (r.active() == null) return msg(HttpStatus.BAD_REQUEST, "active is required.");
        j.setActive(r.active());
        return ResponseEntity.ok(JobResponse.from(jobs.save(j)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!jobs.existsById(id)) return msg(HttpStatus.NOT_FOUND, "Job not found.");
        if (applications.existsByJobId(id)) {
            return msg(HttpStatus.CONFLICT,
                    "This job has applications, so it cannot be deleted. Close it instead.");
        }
        try {
            jobs.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Job deleted."));
        } catch (DataIntegrityViolationException e) {
            return msg(HttpStatus.CONFLICT,
                    "This job is still linked to saved jobs or other data. Close it instead.");
        }
    }
}
