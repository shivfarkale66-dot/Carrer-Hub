package com.example.demo.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;

@Component
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminGmail;
    private final String adminPassword;

    public AdminSeeder(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       @Value("${app.admin.gmail:admin@gmail.com}") String adminGmail,
                       @Value("${app.admin.password}") String adminPassword) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminGmail = adminGmail;
        this.adminPassword = adminPassword;
    }

    @Override
    public void run(String... args) {
        User admin = userRepository.findByGmailIgnoreCase(adminGmail).orElse(null);

        if (admin == null) {
            admin = new User();
            admin.setFullName("Admin");
            admin.setGmail(adminGmail);
        }

        if (admin.getPassword() == null
                || !passwordEncoder.matches(adminPassword, admin.getPassword())) {
            admin.setPassword(passwordEncoder.encode(adminPassword));
        }

        admin.setRole("ADMIN");
        userRepository.save(admin);
        System.out.println(">>> Admin ready: " + adminGmail);
    }
}
