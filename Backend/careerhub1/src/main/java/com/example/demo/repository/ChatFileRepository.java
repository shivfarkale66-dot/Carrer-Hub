package com.example.demo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.ChatFile;

public interface ChatFileRepository extends JpaRepository<ChatFile, Long> {
    Optional<ChatFile> findByMessageId(Long messageId);
}
