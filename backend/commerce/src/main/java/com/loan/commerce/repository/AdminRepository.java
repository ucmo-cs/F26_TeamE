package com.loan.commerce.repository;

import com.loan.commerce.domain.Admin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Admin repository interface for database operations
public interface AdminRepository extends JpaRepository<Admin, Long> {
    Optional<Admin> findByUsername(String username);    // Method to find an admin by username
}