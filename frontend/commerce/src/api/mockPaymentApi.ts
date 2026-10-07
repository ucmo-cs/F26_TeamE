import type { BankAccount, PaymentSchedule } from '../types/loan.ts';
import { loadPrototypeLoans, savePrototypeLoans } from '../utils/prototypeStorage.ts';
import { fakeDelay } from './fakeDelay.ts';

export const mockPaymentApi = {
  /**
   * Adds or replaces a bank account on a loan
   * Prototype only — do not store raw bank data in browser storage in production.
   */
  async updateBankAccount(loanId: string, bankAccount: BankAccount): Promise<BankAccount> {
    await fakeDelay();
    const loans = loadPrototypeLoans();
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) {
      throw new Error(`Loan with ID "${loanId}" not found.`);
    }

    loan.bankAccount = { ...bankAccount };
    savePrototypeLoans(loans);

    return JSON.parse(JSON.stringify(bankAccount));
  },

  /**
   * Saves or updates automatic payment schedule on a loan
   */
  async savePaymentSchedule(loanId: string, schedule: PaymentSchedule): Promise<PaymentSchedule> {
    await fakeDelay();
    const loans = loadPrototypeLoans();
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) {
      throw new Error(`Loan with ID "${loanId}" not found.`);
    }

    loan.paymentSchedule = { ...schedule };
    savePrototypeLoans(loans);

    return JSON.parse(JSON.stringify(schedule));
  },
};
