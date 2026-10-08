package com.loan.commerce.controller;

import com.loan.commerce.domain.Admin;
import com.loan.commerce.domain.User;
import com.loan.commerce.service.AdminService;
import com.loan.commerce.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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

	@PostMapping("/api/login")
	@ResponseBody
	public ResponseEntity<Map<String, String>> unifiedLogin(
			@RequestBody LoginRequest request,
			HttpSession session) {
		Optional<Admin> authenticatedAdmin = adminService.authenticate(request.username(), request.password());
		if (authenticatedAdmin.isPresent()) {
			Admin admin = authenticatedAdmin.get();
			session.setAttribute("userId", admin.getId());
			session.setAttribute("username", admin.getUsername());
			session.setAttribute("role", "ADMIN");
			return ResponseEntity.ok(Map.of(
					"status", "ok",
					"role", "ADMIN",
					"username", admin.getUsername()));
		}

		Optional<User> authenticatedUser = userService.authenticate(request.username(), request.password());
		if (authenticatedUser.isPresent() && !authenticatedUser.get().isAdmin()) {
			User user = authenticatedUser.get();
			session.setAttribute("userId", user.getId());
			session.setAttribute("username", user.getUsername());
			session.setAttribute("role", "USER");
			return ResponseEntity.ok(Map.of(
					"status", "ok",
					"role", "USER",
					"username", user.getUsername()));
		}

		return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
				.body(Map.of("status", "error", "message", "Invalid credentials"));
	}

	@PostMapping("/api/logout")
	@ResponseBody
	public ResponseEntity<Map<String, String>> apiLogout(HttpSession session) {
		session.invalidate();
		return ResponseEntity.ok(Map.of("status", "ok"));
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
	@GetMapping(value = "/api/admin/portal", produces = "text/html")
	@ResponseBody
	public ResponseEntity<String> adminPortal(HttpSession session) {
		if (!"ADMIN".equals(session.getAttribute("role")) || session.getAttribute("username") == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.contentType(MediaType.TEXT_HTML)
					.body("<p>Login required</p>");
		}

		return ResponseEntity.ok("""
				<!doctype html>
				<html lang="en">
				<head>
				  <meta charset="UTF-8">
				  <meta name="viewport" content="width=device-width, initial-scale=1.0">
				  <title>Admin</title>
				  <style>
				    body { font-family: Arial, sans-serif; margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f3f5f7; }
				    main { padding: 2rem 2.5rem; background: white; border: 1px solid #d9dee3; border-radius: 8px; text-align: center; }
				    button { margin-top: 1.25rem; padding: .7rem 1.4rem; color: white; background: #1769aa; border: 0; border-radius: 4px; cursor: pointer; }
				  </style>
				</head>
				<body>
				  <main>
				    <h1>you are logged in as admin!</h1>
				    <form method="post" action="/api/admin/logout">
				      <button type="submit">Log out</button>
				    </form>
				  </main>
				</body>
				</html>
				""");
	}

	@PostMapping("/api/admin/logout")
	public String logout(HttpSession session) {
		session.invalidate();
		return "redirect:/login";
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
