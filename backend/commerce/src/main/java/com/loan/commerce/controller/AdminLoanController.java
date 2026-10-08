package com.loan.commerce.controller;

import com.loan.commerce.service.LoanTrackerService;
import com.loan.commerce.web.SessionAuth;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = { "http://localhost:5173", "http://127.0.0.1:5173" }, allowCredentials = "true")
public class AdminLoanController {

	private final LoanTrackerService loans;

	public AdminLoanController(LoanTrackerService loans) {
		this.loans = loans;
	}

	@GetMapping("/loans")
	public List<Map<String, Object>> list(HttpSession session) {
		SessionAuth.requireAdmin(session);
		return loans.listActiveLoans();
	}

	@GetMapping("/loans/{id}")
	public Map<String, Object> detail(@PathVariable long id, HttpSession session) {
		SessionAuth.requireAdmin(session);
		return loans.getAdminLoan(id);
	}

	@PostMapping("/loans")
	public Map<String, Object> create(@RequestBody Map<String, Object> body, HttpSession session) {
		SessionAuth.requireAdmin(session);
		return loans.createLoan(body);
	}
}
