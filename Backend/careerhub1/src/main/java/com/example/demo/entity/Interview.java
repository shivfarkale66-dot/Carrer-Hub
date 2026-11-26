package com.example.demo.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "interviews")
public class Interview {

    public enum Mode { VIDEO, AUDIO }
    public enum Status { SCHEDULED, COMPLETED, CANCELLED }
    public enum Result { PENDING, SELECTED, REJECTED, ON_HOLD }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    private String jobTitle;
    private String companyName;

    @Enumerated(EnumType.STRING)
    @Column(name = "interview_mode")
    private Mode mode;

    private LocalDateTime scheduledAt;
    private Integer durationMinutes;

    @Enumerated(EnumType.STRING)
    private Status status = Status.SCHEDULED;

    @Enumerated(EnumType.STRING)
    @Column(name = "interview_result")
    private Result result = Result.PENDING;

    @Column(length = 1000)
    private String feedback;

    @Column(length = 1000)
    private String notes;

    private LocalDateTime createdAt = LocalDateTime.now();

    private Boolean reminder1hSent = false;
    private Boolean reminder10mSent = false;

    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public Mode getMode() { return mode; }
    public void setMode(Mode mode) { this.mode = mode; }
    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public Result getResult() { return result == null ? Result.PENDING : result; }
    public void setResult(Result result) { this.result = result; }
    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public boolean isReminder1hSent() { return Boolean.TRUE.equals(reminder1hSent); }
    public void setReminder1hSent(boolean sent) { this.reminder1hSent = sent; }
    public boolean isReminder10mSent() { return Boolean.TRUE.equals(reminder10mSent); }
    public void setReminder10mSent(boolean sent) { this.reminder10mSent = sent; }
}
