package com.example.demo.repository;

import java.util.List;

import com.example.demo.entity.Job;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface JobRepository extends JpaRepository<Job, Long> {

    @Query("SELECT j FROM Job j WHERE "
         + "(:q = '' OR LOWER(j.title) LIKE LOWER(CONCAT('%', :q, '%')) "
         + "   OR LOWER(j.company.name) LIKE LOWER(CONCAT('%', :q, '%'))) AND "
         + "(:city = '' OR LOWER(j.company.city) = LOWER(:city)) AND "
         + "(:type = '' OR LOWER(j.jobType) = LOWER(:type)) AND "
         + "(j.active IS NULL OR j.active = true)")
    Page<Job> search(@Param("q") String q,
                     @Param("city") String city,
                     @Param("type") String type,
                     Pageable pageable);

    List<Job> findByCompanyIdOrderByIdDesc(Long companyId);

    List<Job> findAllByOrderByIdDesc();

    long countByCompanyId(Long companyId);
}
