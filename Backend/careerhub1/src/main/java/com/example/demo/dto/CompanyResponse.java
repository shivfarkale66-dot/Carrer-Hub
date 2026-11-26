package com.example.demo.dto;

import com.example.demo.entity.Company;

public record CompanyResponse(
        Long id,
        String name,
        String city,
        String area,
        String industry,
        String size,
        String about,
        long openJobs) {

    public static CompanyResponse from(Company c, long openJobs) {
        return new CompanyResponse(c.getId(), c.getName(), c.getCity(), c.getArea(),
                c.getIndustry(), c.getCompanySize(), c.getAbout(), openJobs);
    }
}
