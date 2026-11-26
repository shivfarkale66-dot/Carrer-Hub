package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import com.example.demo.entity.Company;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CompanyRepository extends JpaRepository<Company, Long> {

    @Query("SELECT c FROM Company c WHERE "
         + "(:q = '' OR LOWER(c.name) LIKE LOWER(CONCAT('%', :q, '%'))) AND "
         + "(:city = '' OR LOWER(c.city) = LOWER(:city)) ORDER BY c.name")
    List<Company> search(@Param("q") String q, @Param("city") String city);

    Optional<Company> findByNameIgnoreCase(String name);
}
