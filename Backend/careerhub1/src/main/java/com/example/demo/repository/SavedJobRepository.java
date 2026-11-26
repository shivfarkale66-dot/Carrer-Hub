package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import com.example.demo.entity.SavedJob;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SavedJobRepository extends JpaRepository<SavedJob, Long> {

    List<SavedJob> findByUserIdOrderByIdDesc(Long userId);

    Optional<SavedJob> findByUserIdAndJobId(Long userId, Long jobId);
}
