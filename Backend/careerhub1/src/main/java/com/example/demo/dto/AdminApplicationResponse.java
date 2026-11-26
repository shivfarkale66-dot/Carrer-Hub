package com.example.demo.dto;

import java.time.LocalDateTime;

import com.example.demo.entity.Company;
import com.example.demo.entity.JobApplication;

public record AdminApplicationResponse(
        Long id,
        Long userId,
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
        String resumeName,
        String coverLetter,
        Long jobId,
        String jobTitle,
        String companyName,
        String location,
        String status,
        String note,
        LocalDateTime appliedAt,
        boolean hasResume) {

    public static AdminApplicationResponse from(JobApplication a) {
        return from(a, false);
    }

    public static AdminApplicationResponse from(JobApplication a, boolean hasResume) {
        Company c = a.getJob().getCompany();
        String location = (c.getArea() == null || c.getArea().isBlank())
                ? c.getCity()
                : c.getArea() + ", " + c.getCity();
        return new AdminApplicationResponse(
                a.getId(),
                a.getUser().getId(),
                a.getFullName() != null ? a.getFullName() : a.getUser().getFullName(),
                a.getEmail() != null ? a.getEmail() : a.getUser().getGmail(),
                a.getPhone(),
                a.getCurrentCity(),
                a.getWorkChoice(),
                a.getExperience(),
                a.getCurrentCompany(),
                a.getCurrentPackage(),
                a.getExpectedPackage(),
                a.getNoticePeriod(),
                a.getResumeName(),
                a.getCoverLetter(),
                a.getJob().getId(),
                a.getJob().getTitle(),
                c.getName(),
                location,
                a.getStatus(),
                a.getAdminNote(),
                a.getAppliedAt(),
                hasResume);
    }
}
