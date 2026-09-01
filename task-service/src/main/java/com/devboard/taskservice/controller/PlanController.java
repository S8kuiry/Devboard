package com.devboard.taskservice.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.devboard.taskservice.dto.PlanInsightsDTO;
import com.devboard.taskservice.entity.Plan;
import com.devboard.taskservice.entity.Steps;
import com.devboard.taskservice.repository.PlanRepository;
import com.devboard.taskservice.repository.StepsRepository;

import jakarta.transaction.Transactional;

@RestController
@RequestMapping("/plans")
public class PlanController {
    private final PlanRepository planRepository;
    private final StepsRepository stepsRepository;

    public PlanController(PlanRepository planRepository, StepsRepository stepsRepository) {
        this.planRepository = planRepository;
        this.stepsRepository = stepsRepository;
    }

    @PutMapping
    @Transactional
    public ResponseEntity<?> upsertPlan(@RequestBody Plan plan) {
        try {

            // 1. Find existing plan or use the incoming plan
            Plan savedPlan;

            if (plan.getId() != null && planRepository.existsById(plan.getId())) {

                Plan existingPlan = planRepository.findById(plan.getId()).get();

                existingPlan.setTitle(plan.getTitle());
                existingPlan.setOwnerEmail(plan.getOwnerEmail());

                savedPlan = planRepository.save(existingPlan);

            } else {

                savedPlan = planRepository.save(plan);
            }

            // 2. Replace the old steps
            stepsRepository.deleteByPlanId(savedPlan.getId());

            // 3. Save the new steps
            if (plan.getSteps() != null && !plan.getSteps().isEmpty()) {

                for (Steps step : plan.getSteps()) {

                    step.setId(null);
                    step.setPlanId(savedPlan.getId());

                    if (step.getIsCompleted() == null) {
                        step.setIsCompleted(false);
                    }

                    if (step.getPosition() == null) {
                        step.setPosition(0.0);
                    }
                }

                List<Steps> savedSteps = stepsRepository.saveAll(plan.getSteps());

                savedPlan.setSteps(savedSteps);
            }

            return ResponseEntity.ok(savedPlan);

        } catch (Exception e) {

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getPlansByOwner(@RequestParam("ownerEmail") String ownerEmail) {
        try {
            List<Plan> plans = planRepository.findByOwnerEmail(ownerEmail);
            for (Plan plan : plans) {
                plan.setSteps(stepsRepository.findByPlanIdOrderByPositionAsc(plan.getId()));
            }
            return ResponseEntity.ok(plans);
        } catch (Exception e) {

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPlanById(@PathVariable Long id) {
        try {
            Optional<Plan> planOpt = planRepository.findById(id);

            if (planOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Plan not found with id: " + id));
            }

            Plan plan = planOpt.get();
            plan.setSteps(stepsRepository.findByPlanIdOrderByPositionAsc(id));

            return ResponseEntity.ok(plan);

        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/steps/{stepId}/toggle")
    public ResponseEntity<?> toggleStepStatus(@PathVariable Long stepId) {
        try {
            Steps step = stepsRepository.findById(stepId)
                    .orElseThrow(() -> new RuntimeException("Step not found: " + stepId));

            step.setIsCompleted(!step.getIsCompleted());
            Steps updatedStep = stepsRepository.save(step);

            return ResponseEntity.ok(updatedStep);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{planId}/steps/{stepId}")
    public ResponseEntity<?> updateStepStatus(
            @PathVariable Long planId,
            @PathVariable Long stepId,
            @RequestParam("ownerEmail") String ownerEmail,
            @RequestBody Map<String, Boolean> body) {
        try {
            Plan plan = planRepository.findById(planId).orElse(null);
            if (plan == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Plan not found with id: " + planId));
            }
            if (!plan.getOwnerEmail().equals(ownerEmail)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Forbidden: you do not own this plan"));
            }

            Steps step = stepsRepository.findById(stepId)
                    .orElseThrow(() -> new RuntimeException("Step not found: " + stepId));
            if (!step.getPlanId().equals(planId)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Step does not belong to plan " + planId));
            }

            Boolean isCompleted = body.get("isCompleted");
            if (isCompleted == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "isCompleted is required"));
            }

            step.setIsCompleted(isCompleted);
            return ResponseEntity.ok(stepsRepository.save(step));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deletePlan(@PathVariable Long id) {
        try {

            Plan isExist = planRepository.findById(id).get();
            if (isExist == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Plan not found with id: " + id));
            }
            stepsRepository.deleteByPlanId(id);
            planRepository.deleteById(id);
            return ResponseEntity.ok(
                    Map.of("message", "Plan deleted successfully"));

        } catch (Exception e) {

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/ping")
    public ResponseEntity<?> greetings() {
        try {
            return ResponseEntity.ok("greetings");

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }



    @GetMapping("/plans/insights")
public ResponseEntity<?> getPlanInsights(@RequestParam String ownerEmail) {
    try {
        List<PlanInsightsDTO.PlanStepProjection> projections = planRepository.findPlanSummariesByOwner(ownerEmail);

        long totalPlans = projections.size();
        long completedPlans = 0; // <--- NEW COUNTER
        long pendingPlans = 0;   // <--- NEW COUNTER

        long totalSteps = 0;
        long completedSteps = 0;

        List<PlanInsightsDTO.PlanSummary> planSummaries = new ArrayList<>();

        for (PlanInsightsDTO.PlanStepProjection p : projections) {
            long tSteps = p.getTotalSteps() != null ? p.getTotalSteps() : 0;
            long cSteps = p.getCompletedSteps() != null ? p.getCompletedSteps() : 0;

            totalSteps += tSteps;
            completedSteps += cSteps;

            // Plan is complete if it has steps and all steps are finished
            if (tSteps > 0 && cSteps == tSteps) {
                completedPlans++;
            } else {
                pendingPlans++;
            }

            double progress = tSteps > 0 ? ((double) cSteps / tSteps) * 100 : 0.0;

            planSummaries.add(new PlanInsightsDTO.PlanSummary(
                p.getPlanId(),
                p.getTitle(),
                tSteps,
                cSteps,
                Math.round(progress * 10.0) / 10.0,
                p.getUpdatedAt() != null ? p.getUpdatedAt().toString() : null
            ));
        }

        long pendingSteps = totalSteps - completedSteps;
        double overallProgress = totalSteps > 0 ? ((double) completedSteps / totalSteps) * 100 : 0.0;

        PlanInsightsDTO.Response response = new PlanInsightsDTO.Response(
            totalPlans,
            completedPlans, // <--- PASS HERE
            pendingPlans,   // <--- PASS HERE
            totalSteps,
            completedSteps,
            pendingSteps,
            Math.round(overallProgress * 10.0) / 10.0,
            planSummaries
        );

        return ResponseEntity.ok(response);

    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
    }
}

}
