package com.devboard.taskservice.repository;

import com.devboard.taskservice.entity.Steps;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StepsRepository extends JpaRepository<Steps, Long> {

    // Fetch all steps belonging to a specific plan, sorted by position for drag-and-drop
    List<Steps> findByPlanIdOrderByPositionAsc(Long planId);

    // Delete all steps associated with a specific plan (useful when deleting a plan)
    void deleteByPlanId(Long planId);

    
}