package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.CompanyFollow;

public interface CompanyFollowRepository extends JpaRepository<CompanyFollow, Long> {
    List<CompanyFollow> findByUserId(Long userId);
    Optional<CompanyFollow> findByUserIdAndCompanyId(Long userId, Long companyId);
}
