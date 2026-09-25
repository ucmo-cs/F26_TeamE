package com.loan.commerce.repository;

import com.loan.commerce.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// User repository interface for database operations
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username); // Method to find a user by username
}