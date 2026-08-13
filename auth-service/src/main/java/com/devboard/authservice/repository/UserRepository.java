package com.devboard.authservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.devboard.authservice.entity.User;


public  interface UserRepository extends  JpaRepository<User, Long> {
    // Optional<User> findByEmail(String email);
    // Optional<User> findById(Long id);
    User findByEmail(String email);
    boolean existsByEmail(String email);

}
