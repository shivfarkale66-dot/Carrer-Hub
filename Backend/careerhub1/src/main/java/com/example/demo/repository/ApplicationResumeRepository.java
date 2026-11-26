package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.example.demo.entity.ApplicationResume;

public interface ApplicationResumeRepository extends JpaRepository<ApplicationResume, Long> {

    Optional<ApplicationResume> findByApplicationId(Long applicationId);

    boolean existsByApplicationId(Long applicationId);

    @Query("select r.application.id from ApplicationResume r")
    List<Long> findAllApplicationIds();
}
