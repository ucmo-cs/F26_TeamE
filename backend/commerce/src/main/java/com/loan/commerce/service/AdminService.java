package com.loan.commerce.service;

import com.loan.commerce.domain.Admin;
import com.loan.commerce.repository.AdminRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

// Service class for admin-related operations
@Service
public class AdminService {

    // Admin repository for database operations
    private final AdminRepository adminRepository;

    // Constructor to inject the AdminRepository dependency
    public AdminService(AdminRepository adminRepository) {
        this.adminRepository = adminRepository;
    }

    // Method to find an admin by username
    public Optional<Admin> authenticate(String username, String password) {
        return adminRepository.findByUsername(username)
                .filter(admin -> admin.getPassword().equals(password)); // Filter the admin by matching password
    }
}