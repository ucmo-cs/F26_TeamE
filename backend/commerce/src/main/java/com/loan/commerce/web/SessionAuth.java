package com.loan.commerce.web;

import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class SessionAuth {

	private SessionAuth() {
	}

	public static void requireAdmin(HttpSession session) {
		if (session == null || !"ADMIN".equals(session.getAttribute("role"))) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin login required");
		}
	}

	public static long requireCustomerUserId(HttpSession session) {
		if (session == null || !"USER".equals(session.getAttribute("role")) || session.getAttribute("userId") == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Customer login required");
		}
		return ((Number) session.getAttribute("userId")).longValue();
	}
}
