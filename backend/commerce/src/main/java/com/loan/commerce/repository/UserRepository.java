package com.loan.commerce.repository;

import com.loan.commerce.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

// User repository interface for database operations
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username); // Method to find a user by username

    @Query(value = """
            SELECT u.* FROM users u
            JOIN customers c ON c.user_id = u.id
            WHERE LOWER(c.email) = LOWER(:email)
            """, nativeQuery = true)
    Optional<User> findByCustomerEmail(@Param("email") String email);
}