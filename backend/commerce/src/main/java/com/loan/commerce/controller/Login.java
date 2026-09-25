package com.loan.commerce.controller;

import com.loan.commerce.domain.Admin;
import com.loan.commerce.domain.User;
import com.loan.commerce.service.AdminService;
import com.loan.commerce.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.Map;
import java.util.Optional;

@Controller
public class Login {

    // Services for user and admin authentication
	private final UserService userService;
	private final AdminService adminService;

    // Constructor injection for services
	public Login(UserService userService, AdminService adminService) {
		this.userService = userService;
		this.adminService = adminService;
	}

    // Endpoint to serve the login page
	@GetMapping("/login")
	public String loginPage() {
		return "forward:/login.html";
	}

	@PostMapping("/api/admin/login")
	@ResponseBody
	public ResponseEntity<Map<String, String>> login(   
			@RequestBody LoginRequest request,
			HttpSession session) {
		Optional<Admin> authenticatedAdmin = //admin authentication
				adminService.authenticate(request.username(), request.password());

        // If authentication is successful, set session attributes and return success response
		if (authenticatedAdmin.isPresent()) {
			Admin admin = authenticatedAdmin.get();
			session.setAttribute("username", admin.getUsername());
			session.setAttribute("role", "ADMIN");
			return ResponseEntity.ok(Map.of("status", "ok", "redirect", "/api/admin/portal",
					"role", "ADMIN"));
		}

        //else, return unauthorized response with error message
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
				.body(Map.of("status", "error", "message", "Invalid credentials"));
	}

    // Endpoint for user login
	@PostMapping("/api/user/login")
	@ResponseBody
	public ResponseEntity<Map<String, String>> userLogin(
			@RequestBody LoginRequest request,
			HttpSession session) { //user authentication
		Optional<User> authenticatedUser = userService.authenticate(request.username(), request.password());

        //if user is authenticated and not an admin, set session attributes and return success response
		if (authenticatedUser.isPresent() && !authenticatedUser.get().isAdmin()) { 
			User user = authenticatedUser.get();
			session.setAttribute("username", user.getUsername());
			session.setAttribute("role", "USER");
			return ResponseEntity.ok(Map.of("status", "ok", "redirect", "/api/user/portal",
					"role", "USER"));
		}
        
        //else, return unauthorized response with error message
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
				.body(Map.of("status", "error", "message", "Invalid credentials"));
	}

    // Endpoint for admin portal access
	@GetMapping("/api/admin/portal")
	@ResponseBody
	public ResponseEntity<Map<String, String>> adminPortal(HttpSession session) {
		Object username = session.getAttribute("username");
		if (!"ADMIN".equals(session.getAttribute("role")) || username == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(Map.of("status", "error", "message", "Login required"));
		}

        //temporary: return a welcome message for the admin portal
		return ResponseEntity.ok(Map.of("status", "ok", "message", "Welcome to the admin portal",
				"username", username.toString()));
	}

    // Endpoint for user portal access
	@GetMapping("/api/user/portal")
	@ResponseBody
	public ResponseEntity<Map<String, String>> userPortal(HttpSession session) {
		Object username = session.getAttribute("username");
		if (!"USER".equals(session.getAttribute("role")) || username == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(Map.of("status", "error", "message", "User login required"));
		}

        //temporary: return a welcome message for the user portal
		return ResponseEntity.ok(Map.of("status", "ok", "message", "Welcome to the user portal",
				"username", username.toString()));
	}

	private record LoginRequest(String username, String password) {
	}

}
