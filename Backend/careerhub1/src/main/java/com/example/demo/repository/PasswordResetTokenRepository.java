package com.example.demo.repository;

import java.util.Optional;

import com.example.demo.entity.PasswordResetToken;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByGmail(String gmail);
}
