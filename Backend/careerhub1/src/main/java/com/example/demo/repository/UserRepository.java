package com.example.demo.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.example.demo.entity.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByGmail(String gmail);

    Optional<User> findByGmail(String gmail);

    Optional<User> findByGmailIgnoreCase(String gmail);

    @Query("SELECT u FROM User u WHERE u.emailVerified = false AND u.createdAt < :before")
    List<User> findUnverifiedBefore(@Param("before") LocalDateTime before);
}
