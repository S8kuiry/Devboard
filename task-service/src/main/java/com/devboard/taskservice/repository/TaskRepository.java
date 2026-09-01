package com.devboard.taskservice.repository;
import com.devboard.taskservice.entity.*;

import org.springframework.data.repository.query.Param;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/**
 * TaskRepository
 */
public interface TaskRepository extends JpaRepository<Task,Long> {
    List<Task> findByOwnerEmail(String ownerEmail);

    List<Task> findByOwnerEmailAndStatus(String ownerEmail, Task.Status status);
    List<Task> findByOwnerEmailAndPriority(String ownerEmail, Task.Priority priority);
    List<Task> findByAssignedEmailsContaining(String assignedEmail);


    // --- INSIGHTS EFFICIENT QUERIES ---

   // Fetch all tasks where user is owner OR assignee (distinct result set)
    @Query("""
        SELECT DISTINCT t FROM Task t 
        LEFT JOIN t.assignedEmails a 
        WHERE t.ownerEmail = :email OR a = :email
        ORDER BY t.dueDate ASC NULLS LAST
    """)
    List<Task> findAllUserRelatedTasks(@Param("email") String email);


    
} 