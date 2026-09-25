package com.loan.commerce.service;

import com.loan.commerce.domain.User;
import com.loan.commerce.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

// Service class for user-related operations
@Service
public class UserService {

    // User repository for database operations
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Method to find a user by username
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    // Method to authenticate a user by username and password
    public Optional<User> authenticate(String username, String password) {
        return findByUsername(username)
                .filter(user -> user.getPassword().equals(password));
    }

    // Method to save a user to the database
    public User save(User user) {
        return userRepository.save(user);
    }
}