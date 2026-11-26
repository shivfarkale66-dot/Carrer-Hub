package com.example.demo.dto;

import java.time.LocalDateTime;

import com.example.demo.entity.Interview;

public record InterviewResponse(
        Long id,
        Long userId,
        String userName,
        String userGmail,
        String jobTitle,
        String companyName,
        Interview.Mode mode,
        LocalDateTime scheduledAt,
        Integer durationMinutes,
        Interview.Status status,
        Interview.Result result,
        String feedback,
        String notes) {

    public static InterviewResponse from(Interview i) {
        return new InterviewResponse(
                i.getId(),
                i.getUser().getId(),
                i.getUser().getFullName(),
                i.getUser().getGmail(),
                i.getJobTitle(),
                i.getCompanyName(),
                i.getMode(),
                i.getScheduledAt(),
                i.getDurationMinutes(),
                i.getStatus(),
                i.getResult(),
                i.getFeedback(),
                i.getNotes());
    }

    public static InterviewResponse forCandidate(Interview i) {
        InterviewResponse r = from(i);
        return new InterviewResponse(r.id(), r.userId(), r.userName(), r.userGmail(),
                r.jobTitle(), r.companyName(), r.mode(), r.scheduledAt(), r.durationMinutes(),
                r.status(), r.result(), null, r.notes());
    }
}
