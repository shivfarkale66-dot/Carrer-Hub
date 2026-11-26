package com.example.demo.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "company_id")
    private Company company;

    @Column(nullable = false, length = 5)
    private String sender;

    @Column(nullable = false, length = 20)
    private String type = "text";

    @Column(length = 2000)
    private String text;

    private String fileName;

    private Long fileSize;

    private boolean hasFile = false;

    private LocalDateTime createdAt = LocalDateTime.now();

    private Boolean adminRead = true;

    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }
    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }
    public boolean isHasFile() { return hasFile; }
    public void setHasFile(boolean hasFile) { this.hasFile = hasFile; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public boolean isAdminRead() { return adminRead == null || adminRead; }
    public void setAdminRead(boolean adminRead) { this.adminRead = adminRead; }
}
