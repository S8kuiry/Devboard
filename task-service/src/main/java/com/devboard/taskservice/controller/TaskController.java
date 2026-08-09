package com.devboard.taskservice.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

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

@RestController
@RequestMapping("/tasks")
public class TaskController {

    private final TaskRepository taskRepository;

    public TaskController(TaskRepository taskRepository){
        this.taskRepository = taskRepository;
    }

    @PostMapping
    public ResponseEntity<?> createTask(@RequestBody Task request){
        try {
            Task saved = taskRepository.save(request);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }

    }

    @GetMapping
    public ResponseEntity<?> getTasksByOwner(@RequestParam String ownerEmail ){
        try {
            List<Task> tasks = taskRepository.findByOwnerEmail(ownerEmail);
            return ResponseEntity.ok(tasks);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }

    }


    @GetMapping("/{id}")
    public ResponseEntity<?> getTasksById(@PathVariable Long id ){
        try {
            Optional<Task> tasks = taskRepository.findById(id);
            return ResponseEntity.ok(tasks);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }

    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTask(@PathVariable Long id, @RequestBody Task request){
        try {
            Optional<Task> isExisting = taskRepository.findById(id);
            if(isExisting == null){
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Task not found with id: " + id));

            }
             Task existingTask = isExisting.get();

            // 2. Update fields with request data
            existingTask.setTitle(request.getTitle());
            existingTask.setDescription(request.getDescription());
            existingTask.setStatus(request.getStatus());
            existingTask.setPriority(request.getPriority());
            existingTask.setDueDate(request.getDueDate());
            existingTask.setStartDate(request.getStartDate());

            Task savedTask = taskRepository.save(existingTask);
            return ResponseEntity.ok(savedTask);
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable Long id){
        try {
            Optional<Task> isExist = taskRepository.findById(id);
            if(isExist == null){
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Task not found with id: " + id));

            }
            taskRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Task deleted successfully"));            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    
}
