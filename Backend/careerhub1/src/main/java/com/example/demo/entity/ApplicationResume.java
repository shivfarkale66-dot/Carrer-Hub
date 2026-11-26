package com.example.demo.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "application_resumes")
public class ApplicationResume {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "application_id", nullable = false, unique = true)
    private JobApplication application;

    private String name;

    @Column(name = "file_data", columnDefinition = "LONGTEXT")
    private String data;

    public Long getId() { return id; }
    public JobApplication getApplication() { return application; }
    public void setApplication(JobApplication application) { this.application = application; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getData() { return data; }
    public void setData(String data) { this.data = data; }
}
