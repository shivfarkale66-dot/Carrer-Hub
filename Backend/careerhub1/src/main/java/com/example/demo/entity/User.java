package com.example.demo.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String gmail;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role = "USER";

    private Boolean jobAlerts = true;
    private Boolean messageAlerts = true;
    private Boolean newsletter = false;

    private Boolean emailVerified = true;

    private java.time.LocalDateTime createdAt = java.time.LocalDateTime.now();

    public User() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getGmail() {
        return gmail;
    }

    public void setGmail(String gmail) {
        this.gmail = gmail;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRole() {
        return (role == null || role.isBlank())
                ? "USER" : role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public boolean isJobAlerts() {
        return jobAlerts == null || jobAlerts;
    }

    public void setJobAlerts(boolean jobAlerts) {
        this.jobAlerts = jobAlerts;
    }

    public boolean isMessageAlerts() {
        return messageAlerts == null || messageAlerts;
    }

    public void setMessageAlerts(boolean messageAlerts) {
        this.messageAlerts = messageAlerts;
    }

    public boolean isNewsletter() {
        return Boolean.TRUE.equals(newsletter);
    }

    public void setNewsletter(boolean newsletter) {
        this.newsletter = newsletter;
    }

    public boolean isEmailVerified() {
        return emailVerified == null || emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public java.time.LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(java.time.LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
