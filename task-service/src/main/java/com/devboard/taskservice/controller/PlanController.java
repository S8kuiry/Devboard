package com.devboard.taskservice.controller;

import java.util.List;
import java.util.Map;

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
            return ResponseEntity.ok("Success");

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

}
