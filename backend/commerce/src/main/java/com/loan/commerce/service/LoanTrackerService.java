package com.loan.commerce.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class LoanTrackerService {

	private static final Logger log = LoggerFactory.getLogger(LoanTrackerService.class);
	private static final String ALPHANUM = "abcdefghijkmnopqrstuvwxyz23456789";
	private final JdbcTemplate jdbc;
	private final PaymentCalculationService calc;
	private final SecureRandom random = new SecureRandom();

	public LoanTrackerService(JdbcTemplate jdbc, PaymentCalculationService calc) {
		this.jdbc = jdbc;
		this.calc = calc;
	}

	public List<Map<String, Object>> listActiveLoans() {
		return jdbc.query("""
				SELECT l.id, c.name AS customer_name, l.originated_on, l.remaining_balance,
				       l.original_amount, l.interest_rate
				FROM loans l
				JOIN customers c ON c.id = l.customer_id
				WHERE l.remaining_balance > 0
				ORDER BY l.originated_on
				""", (rs, i) -> Map.of(
				"id", rs.getLong("id"),
				"customerName", rs.getString("customer_name"),
				"originationDate", rs.getDate("originated_on").toLocalDate().toString(),
				"amountOwed", rs.getBigDecimal("remaining_balance"),
				"originalAmount", rs.getBigDecimal("original_amount"),
				"interestRate", rs.getBigDecimal("interest_rate")));
	}

	public Map<String, Object> getAdminLoan(long loanId) {
		List<Map<String, Object>> rows = jdbc.query("""
				SELECT l.id, l.originated_on, l.remaining_balance, l.original_amount, l.interest_rate,
				       c.name, c.email, c.phone,
				       b.bank_name, b.routing_number, b.account_number, b.account_holder_name,
				       s.frequency, s.amount AS schedule_amount, s.day_of_month, s.day_of_week, s.start_date
				FROM loans l
				JOIN customers c ON c.id = l.customer_id
				LEFT JOIN bank_accounts b ON b.customer_id = c.id
				LEFT JOIN payment_schedules s ON s.loan_id = l.id
				WHERE l.id = ?
				""", (rs, i) -> loanDetail(rs), loanId);
		if (rows.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Loan not found");
		}
		return rows.get(0);
	}

	@Transactional
	public Map<String, Object> createLoan(Map<String, Object> body) {
		String name = required(body, "customerName");
		String email = required(body, "customerEmail").toLowerCase();
		String phone = required(body, "customerPhone");
		LocalDate originatedOn = LocalDate.parse(required(body, "originationDate"));
		BigDecimal originalAmount = decimal(body.get("originalAmount"));
		BigDecimal interestRate = decimal(body.get("interestRate"));
		if (originalAmount.compareTo(BigDecimal.ZERO) <= 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Original amount must be greater than 0");
		}

		Integer emailCount = jdbc.queryForObject("SELECT COUNT(*) FROM customers WHERE email = ?", Integer.class, email);
		if (emailCount != null && emailCount > 0) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
		}

		String username = uniqueUsername(email);
		String password = randomPassword();

		long userId = insert("INSERT INTO users (username, password, role) VALUES (?, ?, 'USER')",
				ps -> {
					ps.setString(1, username);
					ps.setString(2, password);
				});
		long customerId = insert("INSERT INTO customers (user_id, name, email, phone) VALUES (?, ?, ?, ?)",
				ps -> {
					ps.setLong(1, userId);
					ps.setString(2, name);
					ps.setString(3, email);
					ps.setString(4, phone);
				});
		long loanId = insert("""
				INSERT INTO loans (customer_id, originated_on, original_amount, remaining_balance, interest_rate)
				VALUES (?, ?, ?, ?, ?)
				""", ps -> {
			ps.setLong(1, customerId);
			ps.setDate(2, Date.valueOf(originatedOn));
			ps.setBigDecimal(3, originalAmount);
			ps.setBigDecimal(4, originalAmount);
			ps.setBigDecimal(5, interestRate);
		});

		log.info("Created loan {} for {} with username {} and temporary password {}",
				loanId, email, username, password);

		return Map.of(
				"loanId", loanId,
				"username", username,
				"temporaryPassword", password,
				"message", "Loan created. Customer credentials were generated for " + email + ".");
	}

	public Map<String, Object> getCustomerLoan(long userId) {
		List<Map<String, Object>> rows = jdbc.query("""
				SELECT l.id, l.originated_on, l.remaining_balance, l.original_amount, l.interest_rate,
				       c.id AS customer_id, c.name, c.email, c.phone,
				       b.bank_name, b.routing_number, b.account_number, b.account_holder_name,
				       s.frequency, s.amount AS schedule_amount, s.day_of_month, s.day_of_week, s.start_date
				FROM customers c
				LEFT JOIN loans l ON l.customer_id = c.id
				LEFT JOIN bank_accounts b ON b.customer_id = c.id
				LEFT JOIN payment_schedules s ON s.loan_id = l.id
				WHERE c.user_id = ?
				ORDER BY l.id DESC
				LIMIT 1
				""", (rs, i) -> loanDetail(rs), userId);
		if (rows.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found");
		}
		return rows.get(0);
	}

	@Transactional
	public Map<String, Object> updateCustomerProfile(long userId, Map<String, Object> body) {
		String name = required(body, "name");
		String email = required(body, "email");
		String phone = required(body, "phone");
		List<Long> customerIds = jdbc.query(
				"SELECT id FROM customers WHERE user_id = ?",
				(rs, i) -> rs.getLong(1),
				userId);
		if (customerIds.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found");
		}
		long customerId = customerIds.get(0);

		jdbc.update("UPDATE customers SET name = ?, email = ?, phone = ? WHERE id = ?",
				name, email, phone, customerId);

		String bankName = stringOrEmpty(body.get("bankName"));
		String routing = stringOrEmpty(body.get("routingNumber"));
		String account = stringOrEmpty(body.get("accountNumber"));
		String holder = stringOrEmpty(body.get("accountHolderName"));
		if (holder.isBlank()) {
			holder = name;
		}

		if (!bankName.isBlank() && !routing.isBlank() && !account.isBlank()) {
			Integer count = jdbc.queryForObject(
					"SELECT COUNT(*) FROM bank_accounts WHERE customer_id = ?", Integer.class, customerId);
			if (count != null && count > 0) {
				jdbc.update("""
						UPDATE bank_accounts
						SET bank_name = ?, routing_number = ?, account_number = ?, account_holder_name = ?
						WHERE customer_id = ?
						""", bankName, routing, account, holder, customerId);
			} else {
				jdbc.update("""
						INSERT INTO bank_accounts (customer_id, bank_name, routing_number, account_number, account_holder_name)
						VALUES (?, ?, ?, ?, ?)
						""", customerId, bankName, routing, account, holder);
			}
		}

		return getCustomerLoan(userId);
	}

	public Map<String, Object> minimumPayment(long userId, String frequency) {
		Map<String, Object> loan = getCustomerLoan(userId);
		if (loan.get("id") == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No loan to schedule");
		}
		String freq = normalizeFrequency(frequency);
		BigDecimal owed = (BigDecimal) loan.get("amountOwed");
		BigDecimal rate = (BigDecimal) loan.get("interestRate");
		LocalDate originated = LocalDate.parse(Objects.toString(loan.get("originationDate")));
		BigDecimal min = calc.minimumPayment(owed, rate, calc.remainingTermMonths(originated), freq);
		return Map.of(
				"frequency", freq,
				"paymentsPerYear", calc.paymentsPerYear(freq),
				"minimumPayment", min);
	}

	@Transactional
	public Map<String, Object> saveSchedule(long userId, Map<String, Object> body) {
		Map<String, Object> loan = getCustomerLoan(userId);
		Object loanIdObj = loan.get("id");
		if (loanIdObj == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No loan to schedule");
		}
		long loanId = ((Number) loanIdObj).longValue();
		String frequency = normalizeFrequency(required(body, "frequency"));
		BigDecimal amount = decimal(body.get("paymentAmount") != null ? body.get("paymentAmount") : body.get("amount"));
		LocalDate startDate = LocalDate.parse(required(body, "startDate"));

		BigDecimal owed = (BigDecimal) loan.get("amountOwed");
		BigDecimal rate = (BigDecimal) loan.get("interestRate");
		LocalDate originated = LocalDate.parse(Objects.toString(loan.get("originationDate")));
		BigDecimal minimum = calc.minimumPayment(owed, rate, calc.remainingTermMonths(originated), frequency);
		if (amount.compareTo(minimum) < 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Payment must be at least the minimum of " + minimum);
		}

		Integer dayOfMonth = null;
		Integer dayOfWeek = null;
		if ("MONTHLY".equals(frequency)) {
			dayOfMonth = intValue(body.get("dayOfMonth"), 15);
			if (dayOfMonth < 1 || dayOfMonth > 28) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Day of month must be 1-28");
			}
		} else {
			dayOfWeek = dayOfWeekValue(body.get("dayOfWeek"));
		}

		Integer existing = jdbc.queryForObject(
				"SELECT COUNT(*) FROM payment_schedules WHERE loan_id = ?", Integer.class, loanId);
		if (existing != null && existing > 0) {
			jdbc.update("""
					UPDATE payment_schedules
					SET frequency = ?, amount = ?, day_of_month = ?, day_of_week = ?, start_date = ?
					WHERE loan_id = ?
					""", frequency, amount, dayOfMonth, dayOfWeek, Date.valueOf(startDate), loanId);
		} else {
			jdbc.update("""
					INSERT INTO payment_schedules (loan_id, frequency, amount, day_of_month, day_of_week, start_date)
					VALUES (?, ?, ?, ?, ?, ?)
					""", loanId, frequency, amount, dayOfMonth, dayOfWeek, Date.valueOf(startDate));
		}
		return getCustomerLoan(userId);
	}

	private Map<String, Object> loanDetail(java.sql.ResultSet rs) throws java.sql.SQLException {
		Map<String, Object> loan = new LinkedHashMap<>();
		long loanId = rs.getLong("id");
		if (rs.wasNull() || loanId == 0) {
			loan.put("id", null);
			loan.put("customerName", rs.getString("name"));
			loan.put("customerEmail", rs.getString("email"));
			loan.put("customerPhone", rs.getString("phone"));
			loan.put("bankName", rs.getString("bank_name"));
			loan.put("routingNumber", rs.getString("routing_number"));
			loan.put("accountNumber", rs.getString("account_number"));
			loan.put("accountHolderName", rs.getString("account_holder_name"));
			return loan;
		}

		LocalDate originated = rs.getDate("originated_on").toLocalDate();
		BigDecimal owed = rs.getBigDecimal("remaining_balance");
		BigDecimal original = rs.getBigDecimal("original_amount");
		BigDecimal rate = rs.getBigDecimal("interest_rate");
		String frequency = rs.getString("frequency");
		BigDecimal scheduleAmount = rs.getBigDecimal("schedule_amount");
		Date start = rs.getDate("start_date");
		LocalDate startDate = start == null ? null : start.toLocalDate();

		loan.put("id", loanId);
		loan.put("customerName", rs.getString("name"));
		loan.put("customerEmail", rs.getString("email"));
		loan.put("customerPhone", rs.getString("phone"));
		loan.put("originationDate", originated.toString());
		loan.put("amountOwed", owed);
		loan.put("originalAmount", original);
		loan.put("interestRate", rate);
		loan.put("bankName", rs.getString("bank_name"));
		loan.put("routingNumber", rs.getString("routing_number"));
		loan.put("accountNumber", rs.getString("account_number"));
		loan.put("accountHolderName", rs.getString("account_holder_name"));
		loan.put("paymentFrequency", frequency);
		loan.put("paymentAmount", scheduleAmount);
		Integer dayOfMonth = (Integer) rs.getObject("day_of_month");
		Integer dayOfWeek = (Integer) rs.getObject("day_of_week");
		loan.put("paymentDayOfMonth", dayOfMonth);
		loan.put("paymentDayOfWeek", dayOfWeek);
		loan.put("paymentDayOfWeekName", dayName(dayOfWeek));
		loan.put("paymentStartDate", startDate == null ? null : startDate.toString());
		loan.put("minimumMonthlyPayment",
				calc.minimumPayment(owed, rate, calc.remainingTermMonths(originated), "MONTHLY"));
		LocalDate payoff = null;
		if (frequency != null && scheduleAmount != null) {
			payoff = calc.calculatePayoffDate(owed, rate, scheduleAmount, frequency, startDate);
		}
		loan.put("payoffDate", payoff == null ? null : payoff.toString());
		return loan;
	}

	private long insert(String sql, SqlBinder binder) {
		KeyHolder keys = new GeneratedKeyHolder();
		jdbc.update(con -> {
			PreparedStatement ps = con.prepareStatement(sql, new String[] { "id" });
			binder.bind(ps);
			return ps;
		}, keys);
		Number key = keys.getKey();
		if (key == null) {
			throw new IllegalStateException("Insert did not return an id");
		}
		return key.longValue();
	}

	private String uniqueUsername(String email) {
		String base = email.split("@")[0].replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
		if (base.length() < 3) {
			base = "customer";
		}
		String candidate = base;
		int suffix = 1;
		while (Boolean.TRUE.equals(jdbc.queryForObject(
				"SELECT EXISTS (SELECT 1 FROM users WHERE username = ?)", Boolean.class, candidate))) {
			candidate = base + suffix++;
		}
		return candidate;
	}

	private String randomPassword() {
		StringBuilder sb = new StringBuilder();
		for (int i = 0; i < 8; i++) {
			sb.append(ALPHANUM.charAt(random.nextInt(ALPHANUM.length())));
		}
		return sb.toString();
	}

	private String required(Map<String, Object> body, String key) {
		Object value = body.get(key);
		if (value == null || value.toString().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, key + " is required");
		}
		return value.toString().trim();
	}

	private String stringOrEmpty(Object value) {
		return value == null ? "" : value.toString().trim();
	}

	private BigDecimal decimal(Object value) {
		if (value == null || value.toString().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount is required");
		}
		return new BigDecimal(value.toString());
	}

	private int intValue(Object value, int fallback) {
		if (value == null || value.toString().isBlank()) {
			return fallback;
		}
		return Integer.parseInt(value.toString());
	}

	private String normalizeFrequency(String frequency) {
		String value = frequency == null ? "" : frequency.trim().toUpperCase();
		if (!List.of("MONTHLY", "BIWEEKLY", "WEEKLY").contains(value)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Frequency must be MONTHLY, BIWEEKLY, or WEEKLY");
		}
		return value;
	}

	private Integer dayOfWeekValue(Object value) {
		if (value == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Day of week is required");
		}
		String text = value.toString().trim().toUpperCase();
		return switch (text) {
			case "1", "MONDAY" -> 1;
			case "2", "TUESDAY" -> 2;
			case "3", "WEDNESDAY" -> 3;
			case "4", "THURSDAY" -> 4;
			case "5", "FRIDAY" -> 5;
			case "6", "SATURDAY" -> 6;
			case "7", "SUNDAY" -> 7;
			default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid day of week");
		};
	}

	private String dayName(Integer dayOfWeek) {
		if (dayOfWeek == null) {
			return null;
		}
		return switch (dayOfWeek) {
			case 1 -> "MONDAY";
			case 2 -> "TUESDAY";
			case 3 -> "WEDNESDAY";
			case 4 -> "THURSDAY";
			case 5 -> "FRIDAY";
			case 6 -> "SATURDAY";
			case 7 -> "SUNDAY";
			default -> null;
		};
	}

	@FunctionalInterface
	private interface SqlBinder {
		void bind(PreparedStatement ps) throws java.sql.SQLException;
	}
}
