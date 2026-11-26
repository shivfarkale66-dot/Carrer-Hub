package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.JobApplication;

public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {

    boolean existsByUserIdAndJobId(Long userId, Long jobId);

    boolean existsByUserIdAndJobIdAndStatusNot(Long userId, Long jobId, String status);

    boolean existsByJobId(Long jobId);

    List<JobApplication> findByUserIdOrderByAppliedAtDesc(Long userId);

    List<JobApplication> findAllByOrderByAppliedAtDesc();
}
