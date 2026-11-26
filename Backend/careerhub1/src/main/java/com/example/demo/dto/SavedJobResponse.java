package com.example.demo.dto;

import com.example.demo.entity.Job;

public record SavedJobResponse(
        Long id,
        String title,
        String company,
        String location,
        String salary) {

    public static SavedJobResponse from(Job j) {
        return new SavedJobResponse(
                j.getId(),
                j.getTitle(),
                j.getCompany().getName(),
                j.getCompany().getArea() + ", " + j.getCompany().getCity(),
                j.getSalary());
    }
}
