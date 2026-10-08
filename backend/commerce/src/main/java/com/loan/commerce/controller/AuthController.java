package com.loan.commerce.controller;

import com.loan.commerce.domain.Admin;
import com.loan.commerce.domain.User;
import com.loan.commerce.service.AdminService;
import com.loan.commerce.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"}, allowCredentials = "true")
public class AuthController {

	private final AdminService adminService;
	private final UserService userService;

	public AuthController(AdminService adminService, UserService userService) {
		this.adminService = adminService;
		this.userService = userService;
	}

	@PostMapping("/login")
	public ResponseEntity<?> login(@RequestBody LoginBody request, HttpSession session) {
		Optional<Admin> admin = adminService.authenticate(request.username(), request.password());
		if (admin.isPresent()) {
			return ResponseEntity.ok(storeAdmin(session, admin.get()));
		}

		Optional<User> user = userService.authenticate(request.username(), request.password());
		if (user.isPresent() && !user.get().isAdmin()) {
			return ResponseEntity.ok(storeCustomer(session, user.get()));
		}

		return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
				.body(Map.of("error", "Invalid username or password"));
	}

	@GetMapping("/me")
	public ResponseEntity<?> me(HttpSession session) {
		Object userId = session.getAttribute("userId");
		Object username = session.getAttribute("username");
		Object role = session.getAttribute("role");
		if (userId == null || username == null || role == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(Map.of("error", "Not logged in"));
		}

		return ResponseEntity.ok(new AuthUser(
				((Number) userId).longValue(),
				username.toString(),
				username.toString(),
				"ADMIN".equals(role) ? "ADMIN" : "USER"));
	}

	@PostMapping("/logout")
	public ResponseEntity<Void> logout(HttpSession session) {
		session.invalidate();
		return ResponseEntity.noContent().build();
	}

	private AuthUser storeAdmin(HttpSession session, Admin admin) {
		session.setAttribute("userId", admin.getId());
		session.setAttribute("username", admin.getUsername());
		session.setAttribute("role", "ADMIN");
		return new AuthUser(admin.getId(), admin.getUsername(), admin.getUsername(), "ADMIN");
	}

	private AuthUser storeCustomer(HttpSession session, User user) {
		session.setAttribute("userId", user.getId());
		session.setAttribute("username", user.getUsername());
		session.setAttribute("role", "USER");
		return new AuthUser(user.getId(), user.getUsername(), user.getUsername(), "USER");
	}

	public record LoginBody(String username, String password) {
	}

	public record AuthUser(Long userId, String username, String name, String role) {
	}
}
