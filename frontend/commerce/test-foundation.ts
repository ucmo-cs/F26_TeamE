// Automated verification test for foundation layer

import assert from 'node:assert';
import { DEMO_ADMIN_CREDENTIALS, DEMO_CUSTOMER_CREDENTIALS } from './src/data/mockData.ts';
import {
  formatCurrency,
  formatInterestRate,
  formatTableDate,
  formatProminentDate,
  maskAccountNumber,
  maskRoutingNumber,
} from './src/utils/formatting.ts';
import {
  calculateMonthlyMinimum,
  calculateScheduledMinimum,
  calculateEstimatedPayoffDate,
  DEFAULT_LOAN_TERM_MONTHS,
} from './src/utils/loanCalculations.ts';
import {
  loadPrototypeLoans,
  resetPrototypeState,
  loadPrototypeSession,
} from './src/utils/prototypeStorage.ts';
import { mockAuthApi } from './src/api/mockAuthApi.ts';
import { mockAdminLoansApi } from './src/api/mockAdminLoansApi.ts';
import { mockCustomerApi } from './src/api/mockCustomerApi.ts';
import { mockPaymentApi } from './src/api/mockPaymentApi.ts';

// Mock localStorage in Node environment for testing
class MockLocalStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

globalThis.localStorage = new MockLocalStorage() as unknown as Storage;

async function runTests() {
  console.log('--- Starting Foundation Tests ---');

  // Test 1: Formatting Utilities
  console.log('1. Testing formatting utilities...');
  assert.strictEqual(formatCurrency(12345.67), '$12,345.67');
  assert.strictEqual(formatCurrency(0), '$0.00');
  assert.strictEqual(formatInterestRate(6.25), '6.25%');
  assert.strictEqual(formatTableDate('2026-08-14'), '08/14/2026');
  assert.strictEqual(formatProminentDate('2026-08-14'), 'August 14, 2026');
  assert.strictEqual(maskAccountNumber('000987654321'), '••••••••4321');
  assert.strictEqual(maskRoutingNumber('000012345'), '•••••2345');
  console.log('✓ Formatting utilities passed.');

  // Test 2: Financial & Amortization Calculations
  console.log('2. Testing financial calculations...');
  assert.strictEqual(DEFAULT_LOAN_TERM_MONTHS, 60);

  // $25,000 at 6.25% for 60 months
  const monthlyMin = calculateMonthlyMinimum(25000, 6.25, 60);
  assert.ok(monthlyMin > 480 && monthlyMin < 490, `Expected ~486.21, got ${monthlyMin}`);

  const biweeklyMin = calculateScheduledMinimum(25000, 6.25, 'BIWEEKLY', 60);
  assert.ok(biweeklyMin > 220 && biweeklyMin < 230, `Expected ~224.22, got ${biweeklyMin}`);

  const weeklyMin = calculateScheduledMinimum(25000, 6.25, 'WEEKLY', 60);
  assert.ok(weeklyMin > 110 && weeklyMin < 115, `Expected ~112.11, got ${weeklyMin}`);

  const payoff = calculateEstimatedPayoffDate(18420.32, 6.25, 250.0, 'BIWEEKLY', new Date('2026-10-01'));
  assert.ok(payoff !== null, 'Payoff should be calculated');
  assert.ok(payoff!.numberOfPayments > 0, 'Should have positive payment count');
  assert.ok(payoff!.estimatedPayoffDate.length === 10, 'ISO date format');
  console.log('✓ Financial calculations passed.');

  // Test 3: Prototype Storage & Initial Mock Data
  console.log('3. Testing prototype storage...');
  resetPrototypeState();
  const initialLoans = loadPrototypeLoans();
  assert.strictEqual(initialLoans.length, 4, 'Should seed 4 initial loans');
  assert.strictEqual(initialLoans.filter((l) => l.remainingBalance > 0).length, 3, 'Should have 3 active loans');
  assert.strictEqual(initialLoans.find((l) => l.remainingBalance === 0)?.customer.name, 'Marcus Vance', 'Marcus Vance is fully repaid');
  console.log('✓ Prototype storage seed passed.');

  // Test 4: Mock Auth Service
  console.log('4. Testing mock auth service...');
  // Valid admin login
  const adminUser = await mockAuthApi.loginAdmin(DEMO_ADMIN_CREDENTIALS);
  assert.strictEqual(adminUser.role, 'ADMIN');
  assert.strictEqual(adminUser.name, 'System Administrator');

  // Verify session persisted
  let session = loadPrototypeSession();
  assert.ok(session !== null);
  assert.strictEqual(session!.user.role, 'ADMIN');

  // Logout
  await mockAuthApi.logout();
  session = loadPrototypeSession();
  assert.strictEqual(session, null);

  // Invalid admin login
  await assert.rejects(
    async () => {
      await mockAuthApi.loginAdmin({ username: 'admin', password: 'wrongpassword' });
    },
    { message: 'Invalid username or password.' }
  );

  // Valid customer login
  const customerUser = await mockAuthApi.loginCustomer(DEMO_CUSTOMER_CREDENTIALS);
  assert.strictEqual(customerUser.role, 'CUSTOMER');
  assert.strictEqual(customerUser.usernameOrEmail, 'jane@example.com');
  console.log('✓ Mock auth service passed.');

  // Test 5: Mock Admin Loans API
  console.log('5. Testing mock admin loans API...');
  const activeLoans = await mockAdminLoansApi.getActiveLoans();
  assert.strictEqual(activeLoans.length, 3, 'Active loans must only include remainingBalance > 0');
  assert.ok(!activeLoans.some((l) => l.customerName === 'Marcus Vance'), 'Repaid loan excluded from active loans');

  // Create new loan
  const newLoan = await mockAdminLoansApi.createLoan({
    customerName: 'Test Customer',
    customerEmail: 'test@example.com',
    customerPhone: '(555) 999-0000',
    originalAmount: 12000,
    annualInterestRate: 5.5,
    loanDate: '2026-10-07',
  });
  assert.strictEqual(newLoan.remainingBalance, 12000);

  // Newly created customer should be able to log in with customer123
  const newCustomerLogin = await mockAuthApi.loginCustomer({
    email: 'test@example.com',
    password: 'customer123',
  });
  assert.strictEqual(newCustomerLogin.name, 'Test Customer');

  // Update loan (protect remainingBalance)
  const updatedLoan = await mockAdminLoansApi.updateLoan(newLoan.id, {
    annualInterestRate: 5.0,
    remainingBalance: 99999, // Should be ignored
  });
  assert.strictEqual(updatedLoan.annualInterestRate, 5.0);
  assert.strictEqual(updatedLoan.remainingBalance, 12000, 'remainingBalance must remain unchanged');
  console.log('✓ Mock admin loans API passed.');

  // Test 6: Mock Customer & Payment API
  console.log('6. Testing customer and payment API...');
  const custLoan = await mockCustomerApi.getCustomerLoan({ email: 'jane@example.com' });
  assert.ok(custLoan !== null);
  assert.strictEqual(custLoan!.customer.name, 'Jane Smith');

  // Update profile
  const updatedProfile = await mockCustomerApi.updateCustomerProfile(custLoan!.customer.id, {
    phone: '(555) 000-1111',
  });
  assert.strictEqual(updatedProfile.phone, '(555) 000-1111');

  // Update bank account
  const bankAccount = await mockPaymentApi.updateBankAccount(custLoan!.id, {
    bankName: 'Updated Bank',
    accountType: 'SAVINGS',
    routingNumber: '000088888',
    accountNumber: '000077777777',
  });
  assert.strictEqual(bankAccount.bankName, 'Updated Bank');

  // Save payment schedule
  const schedule = await mockPaymentApi.savePaymentSchedule(custLoan!.id, {
    frequency: 'WEEKLY',
    paymentAmount: 150.0,
    dayOfWeek: 'MONDAY',
    nextPaymentDate: '2026-10-12',
  });
  assert.strictEqual(schedule.frequency, 'WEEKLY');
  console.log('✓ Mock customer & payment API passed.');

  // Test 7: Reset Demo Data
  console.log('7. Testing reset demo data...');
  resetPrototypeState();
  const resetLoans = loadPrototypeLoans();
  assert.strictEqual(resetLoans.length, 4, 'Should be reset back to 4 original loans');
  assert.ok(!resetLoans.some((l) => l.customer.email === 'test@example.com'), 'Newly created customer removed');
  const janeLoan = resetLoans.find((l) => l.customer.email === 'jane@example.com');
  assert.strictEqual(janeLoan?.customer.phone, '(555) 555-1234', 'Original phone restored');
  assert.strictEqual(janeLoan?.bankAccount?.bankName, 'Example National Bank', 'Original bank account restored');
  console.log('✓ Reset demo data passed.');

  console.log('--- ALL TESTS PASSED! ---');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
