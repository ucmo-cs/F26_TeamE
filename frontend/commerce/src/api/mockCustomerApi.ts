import type { BankAccount, CustomerProfile, Loan } from '../types/loan.ts';
import {
  loadPrototypeLoans,
  loadPrototypeSession,
  savePrototypeLoans,
  savePrototypeSession,
  updateCustomerCredentialEmail,
} from '../utils/prototypeStorage.ts';
import { fakeDelay } from './fakeDelay.ts';

export const mockCustomerApi = {
  /**
   * Retrieves the current customer's loan
   */
  async getCustomerLoan(identifier: { loanId?: string; customerId?: string; email?: string }): Promise<Loan | null> {
    await fakeDelay();
    const loans = loadPrototypeLoans();

    let found = loans.find((l) => {
      if (identifier.loanId && l.id === identifier.loanId) return true;
      if (identifier.customerId && l.customer.id === identifier.customerId) return true;
      if (identifier.email && l.customer.email.toLowerCase() === identifier.email.toLowerCase()) return true;
      return false;
    });

    // Fallback to first active loan if specific customer wasn't mapped
    if (!found && loans.length > 0) {
      found = loans[0];
    }

    return found ? JSON.parse(JSON.stringify(found)) : null;
  },

  /**
   * Updates customer profile contact information
   * If customer email changes, updates the prototype login email as well.
   */
  async updateCustomerProfile(
    customerId: string,
    profileUpdates: Partial<CustomerProfile>,
    oldEmail?: string
  ): Promise<CustomerProfile> {
    await fakeDelay();
    const loans = loadPrototypeLoans();
    let updatedCustomer: CustomerProfile | null = null;

    for (let i = 0; i < loans.length; i++) {
      if (
        loans[i].customer.id === customerId ||
        (oldEmail && loans[i].customer.email.toLowerCase() === oldEmail.toLowerCase())
      ) {
        loans[i].customer = {
          ...loans[i].customer,
          ...profileUpdates,
        };
        updatedCustomer = { ...loans[i].customer };
      }
    }

    if (!updatedCustomer) {
      throw new Error(`Customer with ID "${customerId}" not found.`);
    }

    savePrototypeLoans(loans);

    // If customer email changes, update the prototype login email as well per spec Page C3
    if (profileUpdates.email) {
      updateCustomerCredentialEmail(customerId, oldEmail || '', profileUpdates.email);
    }

    // Also update active prototype session if one exists
    const session = loadPrototypeSession();
    if (
      session &&
      (session.user.id === customerId ||
        (oldEmail && session.user.usernameOrEmail.toLowerCase() === oldEmail.toLowerCase()))
    ) {
      if (profileUpdates.name) session.user.name = profileUpdates.name;
      if (profileUpdates.email) session.user.usernameOrEmail = profileUpdates.email;
      savePrototypeSession(session);
    }

    return updatedCustomer;
  },

  /**
   * Updates or adds customer bank account information
   * Prototype only — do not store raw bank data in browser storage in production.
   */
  async updateCustomerBankAccount(
    identifier: { customerId?: string; loanId?: string; email?: string },
    bankAccount: BankAccount
  ): Promise<BankAccount> {
    await fakeDelay();
    const loans = loadPrototypeLoans();
    let matched = false;

    for (let i = 0; i < loans.length; i++) {
      if (
        (identifier.loanId && loans[i].id === identifier.loanId) ||
        (identifier.customerId && loans[i].customer.id === identifier.customerId) ||
        (identifier.email && loans[i].customer.email.toLowerCase() === identifier.email.toLowerCase())
      ) {
        // Prototype only — do not store raw bank data in browser storage in production.
        loans[i].bankAccount = { ...bankAccount };
        matched = true;
      }
    }

    if (!matched && loans.length > 0) {
      loans[0].bankAccount = { ...bankAccount };
      matched = true;
    }

    if (!matched) {
      throw new Error('No loan found to update bank account.');
    }

    savePrototypeLoans(loans);
    return JSON.parse(JSON.stringify(bankAccount));
  },
};
