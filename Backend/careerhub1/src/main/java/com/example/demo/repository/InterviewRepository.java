package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.Interview;

public interface InterviewRepository extends JpaRepository<Interview, Long> {
    List<Interview> findAllByOrderByScheduledAtDesc();
    List<Interview> findByUserGmailOrderByScheduledAtAsc(String gmail);
    List<Interview> findByUserIdAndStatus(Long userId, Interview.Status status);
    long countByStatus(Interview.Status status);

    List<Interview> findByStatusAndScheduledAtBetween(Interview.Status status,
                                                      java.time.LocalDateTime from,
                                                      java.time.LocalDateTime to);
}
