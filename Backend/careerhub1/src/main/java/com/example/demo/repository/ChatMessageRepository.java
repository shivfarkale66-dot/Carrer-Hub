package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.ChatMessage;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByUserIdOrderByIdAsc(Long userId);
    List<ChatMessage> findByUserIdAndCompanyIdOrderByIdAsc(Long userId, Long companyId);

    List<ChatMessage> findAllByOrderByIdAsc();
}
