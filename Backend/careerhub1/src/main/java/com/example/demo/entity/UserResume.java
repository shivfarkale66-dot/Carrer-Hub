package com.example.demo.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "user_resumes")
public class UserResume {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private String name;

    @Column(name = "file_data", columnDefinition = "LONGTEXT")
    private String data;

    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getData() { return data; }
    public void setData(String data) { this.data = data; }
}
