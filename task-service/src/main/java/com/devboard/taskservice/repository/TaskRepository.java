package com.devboard.taskservice.repository;
import com.devboard.taskservice.entity.*;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * TaskRepository
 */
public interface TaskRepository extends JpaRepository<Task,Long> {
    List<Task> findByOwnerEmail(String ownerEmail);

    List<Task> findByOwnerEmailAndStatus(String ownerEmail, Task.Status status);
    List<Task> findByOwnerEmailAndPriority(String ownerEmail, Task.Priority priority);


    
} 