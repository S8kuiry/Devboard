package com.devboard.authservice.service;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.devboard.authservice.dto.AuthResponse;
import com.devboard.authservice.dto.LoginRequest;
import com.devboard.authservice.dto.RegisterRequest;
import com.devboard.authservice.entity.User;
import com.devboard.authservice.repository.*;


@Service
public class AuthService {
    private final UserRepository userRepository;
    private final JwtService jwtService ;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();


    public AuthService(UserRepository userRepository, JwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }
    

    public User register (RegisterRequest request){
        if(userRepository.existsByEmail(request.getEmail())){
            throw new IllegalArgumentException("User already exists");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setName(request.getName());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        return userRepository.save(user);
    }

    public AuthResponse authenticate(LoginRequest request){
        boolean isExists = userRepository.existsByEmail(request.getEmail());

        if(isExists){
            User user = userRepository.findByEmail(request.getEmail());
            if(passwordEncoder.matches(request.getPassword(), user.getPassword())){
                String token = jwtService.generateToken(user.getEmail());
                return  new AuthResponse(
                    token,
                    user.getEmail(),
                    user.getName()
                );

            }else{
                throw new IllegalArgumentException("Invalid password ");
            }
        }
        throw new IllegalArgumentException("User not found");
    }
}
