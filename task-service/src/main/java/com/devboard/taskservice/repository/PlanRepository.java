package com.devboard.taskservice.repository;

import com.devboard.taskservice.entity.Plan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlanRepository extends JpaRepository<Plan, Long> {

    // Fetch all plans owned by a specific user
    List<Plan> findByOwnerEmail(String ownerEmail);
}