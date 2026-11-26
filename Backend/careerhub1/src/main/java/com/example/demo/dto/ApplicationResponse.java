package com.example.demo.dto;

import java.time.LocalDateTime;

import com.example.demo.entity.Company;
import com.example.demo.entity.JobApplication;

public record ApplicationResponse(
        Long id,
        Long jobId,
        String title,
        String company,
        String location,
        LocalDateTime appliedOn,
        String status,
        String note) {

    public static ApplicationResponse from(JobApplication a) {
        Company c = a.getJob().getCompany();
        String location = (c.getArea() == null || c.getArea().isBlank())
                ? c.getCity()
                : c.getArea() + ", " + c.getCity();
        return new ApplicationResponse(
                a.getId(),
                a.getJob().getId(),
                a.getJob().getTitle(),
                c.getName(),
                location,
                a.getAppliedAt(),
                a.getStatus(),
                a.getAdminNote());
    }
}
