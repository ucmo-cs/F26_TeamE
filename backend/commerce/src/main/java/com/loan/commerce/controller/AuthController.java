package com.loan.commerce.controller;

import com.loan.commerce.domain.Admin;
import com.loan.commerce.domain.User;
import com.loan.commerce.service.AdminService;
import com.loan.commerce.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
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
	private final JdbcTemplate jdbc;

	public AuthController(AdminService adminService, UserService userService, JdbcTemplate jdbc) {
		this.adminService = adminService;
		this.userService = userService;
		this.jdbc = jdbc;
	}

	@PostMapping("/login")
	public ResponseEntity<?> login(@RequestBody LoginBody request, HttpSession session) {
		String login = firstNonBlank(request.username(), request.email());
		if (login == null || request.password() == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(Map.of("error", "Invalid username or password"));
		}

		Optional<Admin> admin = adminService.authenticate(login, request.password());
		if (admin.isPresent()) {
			return ResponseEntity.ok(storeAdmin(session, admin.get()));
		}

		Optional<User> user = userService.authenticateUsernameOrEmail(login, request.password());
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

		return ResponseEntity.ok(toAuthUser(
				((Number) userId).longValue(),
				username.toString(),
				role.toString()));
	}

	@PostMapping("/logout")
	public ResponseEntity<Void> logout(HttpSession session) {
		session.invalidate();
		return ResponseEntity.noContent().build();
	}

	private Map<String, Object> storeAdmin(HttpSession session, Admin admin) {
		session.setAttribute("userId", admin.getId());
		session.setAttribute("username", admin.getUsername());
		session.setAttribute("role", "ADMIN");
		return toAuthUser(admin.getId(), admin.getUsername(), "ADMIN");
	}

	private Map<String, Object> storeCustomer(HttpSession session, User user) {
		session.setAttribute("userId", user.getId());
		session.setAttribute("username", user.getUsername());
		session.setAttribute("role", "USER");
		return toAuthUser(user.getId(), user.getUsername(), "USER");
	}

	private Map<String, Object> toAuthUser(long userId, String username, String sessionRole) {
		boolean admin = "ADMIN".equals(sessionRole);
		String name = username;
		String display = username;
		Long loanId = null;
		if (!admin) {
			var names = jdbc.query(
					"SELECT name, email FROM customers WHERE user_id = ?",
					(rs, i) -> Map.of("name", rs.getString("name"), "email", rs.getString("email")),
					userId);
			if (!names.isEmpty()) {
				name = String.valueOf(names.get(0).get("name"));
				display = String.valueOf(names.get(0).get("email"));
			}
			var loans = jdbc.query(
					"""
							SELECT l.id FROM loans l
							JOIN customers c ON c.id = l.customer_id
							WHERE c.user_id = ?
							ORDER BY l.id DESC
							LIMIT 1
							""",
					(rs, i) -> rs.getLong(1),
					userId);
			if (!loans.isEmpty()) {
				loanId = loans.get(0);
			}
		} else {
			name = "System Administrator";
		}

		return Map.of(
				"id", String.valueOf(userId),
				"userId", userId,
				"name", name,
				"usernameOrEmail", display,
				"role", admin ? "ADMIN" : "CUSTOMER",
				"loanId", loanId == null ? "" : String.valueOf(loanId));
	}

	private String firstNonBlank(String... values) {
		for (String value : values) {
			if (value != null && !value.isBlank()) {
				return value.trim();
			}
		}
		return null;
	}

	public record LoginBody(String username, String email, String password) {
	}
}
