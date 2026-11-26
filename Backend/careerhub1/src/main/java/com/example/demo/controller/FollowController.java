package com.example.demo.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.entity.Company;
import com.example.demo.entity.CompanyFollow;
import com.example.demo.entity.User;
import com.example.demo.repository.CompanyFollowRepository;
import com.example.demo.repository.CompanyRepository;
import com.example.demo.repository.UserRepository;

@RestController
@RequestMapping("/api/follows")
public class FollowController {

    private final UserRepository users;
    private final CompanyRepository companies;
    private final CompanyFollowRepository follows;

    public FollowController(UserRepository users, CompanyRepository companies, CompanyFollowRepository follows) {
        this.users = users;
        this.companies = companies;
        this.follows = follows;
    }

    private Optional<User> me(Authentication auth) {
        if (auth == null || auth.getName() == null) return Optional.empty();
        return users.findByGmailIgnoreCase(auth.getName());
    }

    private static ResponseEntity<?> msg(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("message", message));
    }

    @GetMapping
    public ResponseEntity<?> list(Authentication auth) {
        User u = me(auth).orElse(null);
        if (u == null) return msg(HttpStatus.UNAUTHORIZED, "Please login again.");
        List<Long> ids = follows.findByUserId(u.getId()).stream().map(f -> f.getCompany().getId()).toList();
        return ResponseEntity.ok(ids);
    }

    @PutMapping("/{companyId}")
    public ResponseEntity<?> follow(@PathVariable Long companyId, Authentication auth) {
        User u = me(auth).orElse(null);
        if (u == null) return msg(HttpStatus.UNAUTHORIZED, "Please login again.");
        Company c = companies.findById(companyId).orElse(null);
        if (c == null) return msg(HttpStatus.NOT_FOUND, "Company not found.");
        if (follows.findByUserIdAndCompanyId(u.getId(), companyId).isEmpty()) {
            CompanyFollow f = new CompanyFollow();
            f.setUser(u);
            f.setCompany(c);
            follows.save(f);
        }
        return ResponseEntity.ok(Map.of("message", "Following"));
    }

    @DeleteMapping("/{companyId}")
    public ResponseEntity<?> unfollow(@PathVariable Long companyId, Authentication auth) {
        User u = me(auth).orElse(null);
        if (u == null) return msg(HttpStatus.UNAUTHORIZED, "Please login again.");
        follows.findByUserIdAndCompanyId(u.getId(), companyId).ifPresent(follows::delete);
        return ResponseEntity.ok(Map.of("message", "Unfollowed"));
    }
}
