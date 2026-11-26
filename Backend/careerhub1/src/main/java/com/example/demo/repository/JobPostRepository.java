package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.JobPost;

public interface JobPostRepository extends JpaRepository<JobPost, Long> {
    List<JobPost> findAllByOrderByCreatedAtDesc();
}
