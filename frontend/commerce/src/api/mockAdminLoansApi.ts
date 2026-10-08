import type { CreateLoanInput, Loan, LoanSummary } from '../types/loan.ts';
import {
  addCustomerCredential,
  loadPrototypeLoans,
  savePrototypeLoans,
} from '../utils/prototypeStorage.ts';
import { fakeDelay } from './fakeDelay.ts';

export const mockAdminLoansApi = {
  /**
   * Retrieves active loans (remainingBalance > 0)
   */
  async getActiveLoans(): Promise<LoanSummary[]> {
    await fakeDelay();
    const loans = loadPrototypeLoans();
    return loans
      .filter((l) => l.remainingBalance > 0)
      .map((l) => ({
        id: l.id,
        customerName: l.customer.name,
        loanDate: l.loanDate,
        remainingBalance: l.remainingBalance,
        originalAmount: l.originalAmount,
        annualInterestRate: l.annualInterestRate,
      }));
  },

  /**
   * Retrieves a single loan by ID
   */
  async getLoanById(loanId: string): Promise<Loan | null> {
    await fakeDelay();
    const loans = loadPrototypeLoans();
    const found = loans.find((l) => l.id === loanId);
    return found ?? null;
  },

  /**
   * Creates a new loan and registers customer login credentials
   */
  async createLoan(input: CreateLoanInput): Promise<Loan> {
    await fakeDelay();
    const loans = loadPrototypeLoans();

    const newLoanId = `loan-${Date.now()}`;
    const newCustomerId = `cust-${Date.now()}`;

    const newLoan: Loan = {
      id: newLoanId,
      customer: {
        id: newCustomerId,
        name: input.customerName.trim(),
        email: input.customerEmail.trim().toLowerCase(),
        phone: input.customerPhone.trim(),
      },
      loanDate: input.loanDate,
      originalAmount: input.originalAmount,
      remainingBalance: input.originalAmount,
      annualInterestRate: input.annualInterestRate,
    };

    loans.push(newLoan);
    savePrototypeLoans(loans);

    // Register demo customer credentials for login
    addCustomerCredential({
      email: newLoan.customer.email,
      passwordHashSimulated: 'customer123',
      customerId: newCustomerId,
      loanId: newLoanId,
    });

    return newLoan;
  },

  /**
   * Updates an existing loan. Note: remainingBalance remains unmodified per spec.
   */
  async updateLoan(loanId: string, updates: Partial<Loan>): Promise<Loan> {
    await fakeDelay();
    const loans = loadPrototypeLoans();
    const index = loans.findIndex((l) => l.id === loanId);
    if (index === -1) {
      throw new Error(`Loan with ID "${loanId}" not found.`);
    }

    const current = loans[index];
    const updated: Loan = {
      ...current,
      ...updates,
      // Protect remaining balance from direct edit per spec
      remainingBalance: current.remainingBalance,
      customer: updates.customer ? { ...current.customer, ...updates.customer } : current.customer,
    };

    loans[index] = updated;
    savePrototypeLoans(loans);

    return updated;
  },
};
