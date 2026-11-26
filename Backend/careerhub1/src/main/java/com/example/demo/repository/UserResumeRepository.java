package com.example.demo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.UserResume;

public interface UserResumeRepository extends JpaRepository<UserResume, Long> {
    Optional<UserResume> findByUserId(Long userId);
}
