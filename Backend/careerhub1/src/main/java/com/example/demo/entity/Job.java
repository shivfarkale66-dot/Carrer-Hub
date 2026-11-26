package com.example.demo.entity;

import java.time.LocalDate;

import jakarta.persistence.*;

@Entity
@Table(name = "jobs")
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @ManyToOne(optional = false)
    @JoinColumn(name = "company_id")
    private Company company;

    private String category;

    @Column(nullable = false)
    private String jobType;

    private String salary;
    private String experience;
    private String workMode;
    private Double lpa;

    @Column(length = 2000)
    private String description;

    private LocalDate postedAt;

    @Column(name = "is_active")
    private Boolean active = true;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getJobType() { return jobType; }
    public void setJobType(String jobType) { this.jobType = jobType; }
    public String getSalary() { return salary; }
    public void setSalary(String salary) { this.salary = salary; }
    public String getExperience() { return experience; }
    public void setExperience(String experience) { this.experience = experience; }
    public String getWorkMode() { return workMode; }
    public void setWorkMode(String workMode) { this.workMode = workMode; }
    public Double getLpa() { return lpa; }
    public void setLpa(Double lpa) { this.lpa = lpa; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDate getPostedAt() { return postedAt; }
    public void setPostedAt(LocalDate postedAt) { this.postedAt = postedAt; }
    public boolean isActive() { return active == null || active; }
    public void setActive(boolean active) { this.active = active; }
}
