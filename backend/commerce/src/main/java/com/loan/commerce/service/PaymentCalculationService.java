package com.loan.commerce.service;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDate;

@Service
public class PaymentCalculationService {

	private static final MathContext MC = new MathContext(16, RoundingMode.HALF_UP);
	private static final int MAX_PERIODS = 1200;
	private static final int ORIGINAL_TERM_MONTHS = 60;

	public int paymentsPerYear(String frequency) {
		return switch (frequency) {
			case "BIWEEKLY" -> 26;
			case "WEEKLY" -> 52;
			default -> 12;
		};
	}

	public int remainingTermMonths(LocalDate originatedOn) {
		if (originatedOn == null) {
			return ORIGINAL_TERM_MONTHS;
		}
		int elapsed = (int) java.time.temporal.ChronoUnit.MONTHS.between(originatedOn, LocalDate.now());
		return Math.max(1, ORIGINAL_TERM_MONTHS - Math.max(0, elapsed));
	}

	public BigDecimal minimumPayment(BigDecimal principal, BigDecimal annualRatePercent,
			int termMonths, String frequency) {
		if (principal == null || principal.compareTo(BigDecimal.ZERO) <= 0) {
			return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
		}

		int ppy = paymentsPerYear(frequency);
		int n = Math.max(1, (int) Math.round(termMonths * (ppy / 12.0)));

		BigDecimal annualRate = annualRatePercent.divide(BigDecimal.valueOf(100), MC);
		if (annualRate.compareTo(BigDecimal.ZERO) == 0) {
			return principal.divide(BigDecimal.valueOf(n), 2, RoundingMode.HALF_UP);
		}

		BigDecimal r = annualRate.divide(BigDecimal.valueOf(ppy), MC);
		BigDecimal onePlusR = BigDecimal.ONE.add(r, MC);
		BigDecimal pow = onePlusR.pow(n, MC);
		BigDecimal numerator = r.multiply(pow, MC);
		BigDecimal denominator = pow.subtract(BigDecimal.ONE, MC);
		return principal.multiply(numerator.divide(denominator, MC), MC).setScale(2, RoundingMode.HALF_UP);
	}

	public LocalDate calculatePayoffDate(BigDecimal balance, BigDecimal annualRatePercent,
			BigDecimal payment, String frequency, LocalDate startDate) {
		if (payment == null || balance == null || balance.compareTo(BigDecimal.ZERO) <= 0) {
			return null;
		}

		int ppy = paymentsPerYear(frequency);
		BigDecimal annualRate = annualRatePercent.divide(BigDecimal.valueOf(100), MC);
		BigDecimal periodRate = annualRate.divide(BigDecimal.valueOf(ppy), MC);
		BigDecimal remaining = balance;
		LocalDate date = startDate != null ? startDate : LocalDate.now();

		for (int i = 0; i < MAX_PERIODS; i++) {
			BigDecimal interest = remaining.multiply(periodRate, MC);
			BigDecimal principalPaid = payment.subtract(interest, MC);
			if (principalPaid.compareTo(BigDecimal.ZERO) <= 0) {
				return null;
			}
			if (principalPaid.compareTo(remaining) >= 0) {
				return date;
			}
			remaining = remaining.subtract(principalPaid, MC);
			date = switch (frequency) {
				case "BIWEEKLY" -> date.plusWeeks(2);
				case "WEEKLY" -> date.plusWeeks(1);
				default -> date.plusMonths(1);
			};
		}
		return null;
	}
}
