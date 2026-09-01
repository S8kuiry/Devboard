package com.devboard.taskservice.repository;

import com.devboard.taskservice.entity.Plan;
import com.devboard.taskservice.dto.PlanInsightsDTO.PlanStepProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlanRepository extends JpaRepository<Plan, Long> {

    // Fetch all plans owned by a specific user
    List<Plan> findByOwnerEmail(String ownerEmail);

    // Single-query DB aggregation joining unmapped Steps entity
    @Query("""
        SELECT 
            p.id AS planId,
            p.title AS title,
            p.updatedAt AS updatedAt,
            COUNT(s.id) AS totalSteps,
            COALESCE(SUM(CASE WHEN s.isCompleted = true THEN 1 ELSE 0 END), 0) AS completedSteps
        FROM Plan p
        LEFT JOIN Steps s ON p.id = s.planId
        WHERE p.ownerEmail = :ownerEmail
        GROUP BY p.id, p.title, p.updatedAt
        ORDER BY p.updatedAt DESC
    """)
    List<PlanStepProjection> findPlanSummariesByOwner(@Param("ownerEmail") String ownerEmail);
}