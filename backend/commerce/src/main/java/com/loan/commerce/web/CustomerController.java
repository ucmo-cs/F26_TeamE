package com.loan.commerce.web;

import com.loan.commerce.service.LoanTrackerService;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/customer")
@CrossOrigin(origins = { "http://localhost:5173", "http://127.0.0.1:5173" }, allowCredentials = "true")
public class CustomerController {

	private final LoanTrackerService loans;

	public CustomerController(LoanTrackerService loans) {
		this.loans = loans;
	}

	@GetMapping("/loan")
	public Map<String, Object> loan(HttpSession session) {
		return loans.getCustomerLoan(SessionAuth.requireCustomerUserId(session));
	}

	@PutMapping("/profile")
	public Map<String, Object> profile(@RequestBody Map<String, Object> body, HttpSession session) {
		return loans.updateCustomerProfile(SessionAuth.requireCustomerUserId(session), body);
	}

	@GetMapping("/minimum-payment")
	public Map<String, Object> minimumPayment(@RequestParam String frequency, HttpSession session) {
		return loans.minimumPayment(SessionAuth.requireCustomerUserId(session), frequency);
	}

	@PostMapping("/schedule")
	public Map<String, Object> schedule(@RequestBody Map<String, Object> body, HttpSession session) {
		return loans.saveSchedule(SessionAuth.requireCustomerUserId(session), body);
	}
}
