package com.example.demo.dto;

import java.time.LocalDateTime;

import com.example.demo.entity.Interview;

public record InterviewRequest(
        Long userId,
        String jobTitle,
        String companyName,
        Interview.Mode mode,
        LocalDateTime scheduledAt,
        Integer durationMinutes,
        String notes) {
}
