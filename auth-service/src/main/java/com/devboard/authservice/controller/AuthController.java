package com.devboard.authservice.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.devboard.authservice.dto.AuthResponse;
import com.devboard.authservice.dto.LoginRequest;
import com.devboard.authservice.dto.RegisterRequest;
import com.devboard.authservice.entity.User;
import com.devboard.authservice.repository.UserRepository;
import com.devboard.authservice.service.AuthService;

import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    public AuthController(AuthService authService, UserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            User user = authService.register(request);
            // Returns {"message": "User registered: email@example.com"}
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("message", "User registered: " + user.getEmail()));

        } catch (IllegalArgumentException e) {
            // Returns {"error": "Email already in use"}
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.authenticate(request);
            // Returns AuthResponse JSON object directly
            return ResponseEntity.ok(response); 

        } catch (IllegalArgumentException e) {
            // Returns {"error": "Invalid credentials"}
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/emails")
    public ResponseEntity<?> getUserEmails(){
        try {
            List<User> user =  userRepository.findAll();
            List<String> emails = user.stream().map(User :: getEmail).toList();
            return ResponseEntity.ok(emails);
        } catch(IllegalArgumentException e) {
            // Returns {"error": "Invalid credentials"}
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }


    @GetMapping("/exists")
    public ResponseEntity<?> checkUserExits(@RequestParam("email") String email ){
        try {
            User existEmail = userRepository.findByEmail(email);
            return ResponseEntity.ok(existEmail != null);
            
        } catch(IllegalArgumentException e) {
            // Returns {"error": "Invalid credentials"}
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
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