package com.devboard.taskservice.dto;

import com.devboard.taskservice.entity.Task;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public class TaskInsightsDTO {

    // 1. Lightweight Task Object
    public record TaskSummary(
        Long id,
        String title,
        Task.Status status,
        Task.Priority priority,
        LocalDate dueDate,
        String ownerEmail,
        List<String> assignedEmails
    ) {}

    // 2. Comprehensive Analytics Payload
    public record Response(
        long totalTasks,           // Total relevant tasks (Owned OR Assigned)
        long completedTasks,       // Status == DONE
        long activeTasks,          // Status != DONE
        long overdueTasks,         // Due Date < Today & Status != DONE
        long createdTasksCount,    // Owned by user
        long assignedTasksCount,   // Assigned to user
        double completionRate,     // (Completed / Total) * 100
        Map<String, Long> statusBreakdown,
        Map<String, Long> priorityBreakdown,
        List<TaskSummary> tasks
    ) {}
}