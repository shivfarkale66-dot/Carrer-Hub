package com.example.demo.dto;

import java.time.LocalDate;

import com.example.demo.entity.Company;
import com.example.demo.entity.Job;

public record JobResponse(
        Long id,
        String title,
        Long companyId,
        String company,
        String city,
        String area,
        String location,
        String category,
        String type,
        String pay,
        String exp,
        String workMode,
        Double lpa,
        String description,
        LocalDate postedAt,
        boolean active) {

    public static JobResponse from(Job j) {
        Company c = j.getCompany();
        String location = (c.getArea() == null || c.getArea().isBlank())
                ? c.getCity()
                : c.getArea() + ", " + c.getCity();
        return new JobResponse(
                j.getId(),
                j.getTitle(),
                c.getId(),
                c.getName(),
                c.getCity(),
                c.getArea(),
                location,
                j.getCategory(),
                j.getJobType(),
                j.getSalary(),
                j.getExperience(),
                j.getWorkMode(),
                j.getLpa(),
                j.getDescription(),
                j.getPostedAt(),
                j.isActive());
    }
}
