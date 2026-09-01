package com.devboard.taskservice.dto;

import java.time.LocalDateTime;
import java.util.List;

public class PlanInsightsDTO {

    // Projection interface for JPQL aggregation
    public interface PlanStepProjection {
        Long getPlanId();
        String getTitle();
        Long getTotalSteps();
        Long getCompletedSteps();
        LocalDateTime getUpdatedAt();
    }

    // Individual plan summary record
    public record PlanSummary(
        Long id,
        String title,
        long totalSteps,
        long completedSteps,
        double progressPercentage,
        String updatedAt
    ) {}

    // Main API Response Payload
    public record Response(
        long totalPlans,
        long completedPlans, // <--- NEW FIELD
        long pendingPlans,   // <--- NEW FIELD
        long totalSteps,
        long completedSteps,
        long pendingSteps,
        double overallProgressPercentage,
        List<PlanSummary> plans
    ) {}
}