package com.devboard.taskservice.controller;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.devboard.taskservice.entity.Task;
import com.devboard.taskservice.repository.TaskRepository;
import com.devboard.taskservice.service.EmailService;
import com.devboard.taskservice.websocket.TaskWebSocketHandler;

import jakarta.transaction.Transactional;

@RestController
@RequestMapping("/tasks")
public class TaskController {

    private final TaskRepository taskRepository;
    private final EmailService emailService;
    private final TaskWebSocketHandler webSocketHandler;

    public TaskController(TaskRepository taskRepository, EmailService emailService,
            TaskWebSocketHandler webSocketHandler) {
        this.taskRepository = taskRepository;
        this.emailService = emailService;
        this.webSocketHandler = webSocketHandler;
    }

    @Transactional
    @PostMapping
    public ResponseEntity<?> createTask(@RequestBody Task request) {
        try {
            List<String> assignedEmails = request.getAssignedEmails();
            Task saved = taskRepository.save(request);

            if (assignedEmails != null && !assignedEmails.isEmpty()) {
                emailService.sendTaskAssignments(assignedEmails, request.getTitle());

                // WebSocket UI sync: Notify assigned users
                for (String email : assignedEmails) {
                    webSocketHandler.notifyUser(email, "{\"type\":\"TASK_ASSIGNED\"}");
                }
            }

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping(params = "ownerEmail")
    public ResponseEntity<?> getTasksByOwner(@RequestParam String ownerEmail) {
        try {
            List<Task> tasks = taskRepository.findByOwnerEmail(ownerEmail);
            return ResponseEntity.ok(tasks);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping(params = "assignedEmail")
    public ResponseEntity<?> getAssignedTasks(@RequestParam String assignedEmail) {
        try {
            List<Task> assignedTasks = taskRepository.findByAssignedEmailsContaining(assignedEmail);
            return ResponseEntity.ok(assignedTasks);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTasksById(@PathVariable Long id) {
        Optional<Task> task = taskRepository.findById(id);
        if (task.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Task not found with id: " + id));
        }
        return ResponseEntity.ok(task.get());
    }

    @Transactional
    @PutMapping("/{id}")
    public ResponseEntity<?> updateTask(@PathVariable Long id, @RequestBody Task request) {
        try {
            Optional<Task> isExisting = taskRepository.findById(id);
            if (isExisting.isEmpty()) { // Fixed Optional null check
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Task not found with id: " + id));
            }

            Task existingTask = isExisting.get();

            // FIXED: Copy lazy list into a plain Java ArrayList to avoid
            // LazyInitializationException
            List<String> oldAssignedEmails = existingTask.getAssignedEmails() != null
                    ? new ArrayList<>(existingTask.getAssignedEmails())
                    : new ArrayList<>();

            existingTask.setTitle(request.getTitle());
            existingTask.setDescription(request.getDescription());
            existingTask.setStatus(request.getStatus());
            existingTask.setPriority(request.getPriority());
            existingTask.setDueDate(request.getDueDate());
            existingTask.setStartDate(request.getStartDate());
            existingTask.setAssignedEmails(request.getAssignedEmails());

            Task savedTask = taskRepository.save(existingTask);

            emailService.sendTaskAssignmentsOnUpdate(oldAssignedEmails, request.getAssignedEmails(),
                    request.getTitle());

            // WebSocket UI Sync: Collect ALL stakeholders (Owner + Old Assignees + New
            // Assignees)
            Set<String> usersToNotify = new HashSet<>(oldAssignedEmails);
            if (savedTask.getAssignedEmails() != null) {
                usersToNotify.addAll(savedTask.getAssignedEmails());
            }
            if (savedTask.getOwnerEmail() != null) {
                usersToNotify.add(savedTask.getOwnerEmail());
            }

            // Broadcast status/task changes to everyone's UI
            for (String email : usersToNotify) {
                webSocketHandler.notifyUser(email, "{\"type\":\"TASK_UPDATED\"}");
            }

            return ResponseEntity.ok(savedTask);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable Long id) {
        try {
            Optional<Task> isExist = taskRepository.findById(id);
            if (isExist.isEmpty()) { // Fixed Optional null check
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Task not found with id: " + id));
            }

            // 1. Capture stakeholders BEFORE deleting entity
            Task taskToDelete = isExist.get();
            Set<String> usersToNotify = new HashSet<>();
            if (taskToDelete.getAssignedEmails() != null) {
                usersToNotify.addAll(taskToDelete.getAssignedEmails());
            }
            if (taskToDelete.getOwnerEmail() != null) {
                usersToNotify.add(taskToDelete.getOwnerEmail());
            }

            taskRepository.deleteById(id);

            // 3. WebSocket UI Sync: Tell all open screens to remove the card (No email
            // sent)
            for (String email : usersToNotify) {
                webSocketHandler.notifyUser(email, "{\"type\":\"TASK_DELETED\"}");
            }

            return ResponseEntity.ok(Map.of("message", "Task deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
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