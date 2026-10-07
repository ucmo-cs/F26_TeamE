import { spawn } from 'node:child_process';
import assert from 'node:assert';
import puppeteer, { Page } from 'puppeteer-core';
import { calculateScheduledMinimum } from './src/utils/loanCalculations.ts';
import { formatCurrency } from './src/utils/formatting.ts';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 5182; // Dedicated port 5182
const BASE_URL = `http://localhost:${PORT}`;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url: string, timeoutMs = 15000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // retry
    }
    await sleep(300);
  }
  return false;
}

async function clearAndType(page: Page, selector: string, text: string) {
  await page.waitForSelector(selector, { timeout: 5000 });
  await page.click(selector);
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await page.type(selector, text);
}

async function logout(page: Page) {
  await page.waitForSelector('header', { timeout: 5000 });
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('header button'));
    const logoutBtn = btns.find((b) => b.textContent?.includes('Log Out'));
    if (logoutBtn) logoutBtn.click();
  });
  await page.waitForSelector('#customer-email', { timeout: 6000 });
}

async function runAutomaticPaymentsTests() {
  console.log('=== Starting Customer Automatic Payments Verification Tests ===');

  console.log('1. Starting Vite development server on port ' + PORT + '...');
  const viteProc = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
    shell: true,
    cwd: process.cwd(),
    stdio: 'pipe',
  });

  const isUp = await waitForServer(BASE_URL);
  assert.ok(isUp, 'Vite dev server failed to start within timeout');
  console.log(`✓ Dev server running at ${BASE_URL}`);

  console.log('2. Launching headless Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    page.on('pageerror', (err) => console.error('  [PageError]', err));

    // Clear state before test
    await page.goto(`${BASE_URL}/customer/login`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });

    // =========================================================================
    // TEST 1: Bank Account Requirement Guard (Robert Davis - no bank account initially)
    // =========================================================================
    console.log('\n--- TEST 1: Bank Account Requirement Guard ---');
    console.log('3. Logging in as robert@example.com (customer without bank account)...');
    await page.waitForSelector('#customer-email');
    await clearAndType(page, '#customer-email', 'robert@example.com');
    await clearAndType(page, '#customer-password', 'customer123');
    await page.click('button[type="submit"]');

    await page.waitForFunction(() => window.location.pathname === '/customer/loan', { timeout: 8000 });
    await page.goto(`${BASE_URL}/customer/payments`, { waitUntil: 'networkidle0' });
    assert.strictEqual(page.url(), `${BASE_URL}/customer/payments`);

    // Verify warning banner appears
    await page.waitForSelector('[role="alert"]', { timeout: 5000 });
    const warningText = await page.$eval('[role="alert"]', (el) => el.textContent || '');
    assert.ok(
      warningText.includes('Add a bank account before scheduling automatic payments.'),
      'Warning must state "Add a bank account before scheduling automatic payments."'
    );
    console.log('✓ Warning banner "Add a bank account before scheduling automatic payments." displayed');

    // Verify Save Schedule is disabled
    const isSaveDisabled = await page.$eval('button[type="submit"]', (el: HTMLButtonElement) => el.disabled);
    assert.strictEqual(isSaveDisabled, true, 'Save Schedule button must be disabled when no bank account exists');
    console.log('✓ Save Schedule button is disabled when bank account is missing');

    // Click "Go to Profile" in warning
    console.log('4. Following "Go to Profile" action to add bank account...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const profileBtn = btns.find((b) => b.textContent?.includes('Go to Profile'));
      if (profileBtn) profileBtn.click();
    });
    await page.waitForFunction(() => window.location.pathname === '/customer/profile', { timeout: 5000 });
    assert.strictEqual(page.url(), `${BASE_URL}/customer/profile`, 'Go to Profile navigates to /customer/profile');

    // Add bank account in Profile
    await page.waitForSelector('main');
    await page.waitForFunction(
      () => Array.from(document.querySelectorAll('button')).some((b) => b.textContent?.includes('Add Bank Account')),
      { timeout: 8000 }
    );
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find((b) => b.textContent?.includes('Add Bank Account'));
      if (addBtn) addBtn.click();
    });

    await page.waitForSelector('#bank-name', { timeout: 5000 });
    await clearAndType(page, '#bank-name', 'First National Bank');
    await clearAndType(page, '#bank-routing-number', '000012345');
    await clearAndType(page, '#bank-account-number', '000987654321');

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const saveBankBtn = btns.find((b) => b.textContent?.includes('Save Bank Account'));
      if (saveBankBtn) saveBankBtn.click();
    });

    await page.waitForSelector('[role="alert"]', { timeout: 5000 });
    console.log('✓ Bank account added in Profile');

    // Return to Payments
    console.log('5. Returning to /customer/payments after adding bank account...');
    await page.goto(`${BASE_URL}/customer/payments`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#payment-amount', { timeout: 5000 });

    // Warning banner should be gone
    const hasWarning = await page.evaluate(() => {
      const alerts = Array.from(document.querySelectorAll('[role="alert"]'));
      return alerts.some((a) => a.textContent?.includes('Add a bank account'));
    });
    assert.strictEqual(hasWarning, false, 'Bank warning alert must disappear after adding bank account');
    console.log('✓ Bank account warning is removed and scheduling is unblocked');

    // =========================================================================
    // TEST 2: Monthly Frequency Tests
    // =========================================================================
    console.log('\n--- TEST 2: Monthly Frequency Behavior ---');
    // Ensure Monthly is selected
    await page.click('#freq-monthly');

    // 1. Verify days only 1–28
    console.log('6. Verifying day-of-month selector allows strictly 1–28...');
    await page.waitForSelector('#schedule-day-of-month');
    const dayOptions = await page.$$eval('#schedule-day-of-month option', (opts) =>
      opts.map((o) => parseInt(o.value, 10))
    );
    assert.strictEqual(dayOptions.length, 28, 'Must have exactly 28 day options');
    assert.strictEqual(dayOptions[0], 1, 'First day is 1');
    assert.strictEqual(dayOptions[27], 28, 'Last day is 28');
    console.log('✓ Day of month options are strictly 1–28');

    // 2. Monthly minimum displayed
    console.log('7. Verifying monthly minimum payment display...');
    const robertMonthlyMin = calculateScheduledMinimum(11200, 5.75, 'MONTHLY');
    const formattedMinMonthly = formatCurrency(robertMonthlyMin);
    const minTextMonthly = await page.$eval('#minimum-payment-display', (el) => el.textContent || '');
    assert.ok(
      minTextMonthly.includes(formattedMinMonthly),
      `Monthly minimum must display ${formattedMinMonthly}, got ${minTextMonthly}`
    );
    console.log(`✓ Monthly minimum displayed correctly: ${formattedMinMonthly}`);

    // 3. Amount below minimum rejected
    console.log('8. Testing amount below minimum rejection...');
    await clearAndType(page, '#payment-amount', '100.00');
    // Wait for validation error to render
    await page.waitForSelector('#payment-amount-error', { timeout: 5000 });
    const errorText = await page.$eval('#payment-amount-error', (el) => el.textContent || '');
    assert.ok(
      errorText.includes(`Payment must be at least ${formattedMinMonthly}.`),
      `Expected error "Payment must be at least ${formattedMinMonthly}.", got "${errorText}"`
    );

    const isBelowMinDisabled = await page.$eval('button[type="submit"]', (el: HTMLButtonElement) => el.disabled);
    assert.strictEqual(isBelowMinDisabled, true, 'Save Schedule is disabled when payment is below minimum');
    console.log('✓ Amount below minimum ($100.00) rejected with inline error and disables submit');

    // 4. Save valid monthly schedule
    console.log('9. Saving valid Monthly schedule with $300.00 on the 10th...');
    await clearAndType(page, '#payment-amount', '300.00');
    await page.select('#schedule-day-of-month', '10');

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForSelector('[role="alert"]', { timeout: 6000 });
    const saveMonthlyAlert = await page.$eval('[role="alert"]', (el) => el.textContent?.trim());
    assert.strictEqual(saveMonthlyAlert, 'Payment schedule saved.');

    // Check Current Schedule card
    await page.waitForSelector('#current-payment-amount', { timeout: 5000 });
    const curMonthlyAmt = await page.$eval('#current-payment-amount', (el) => el.textContent?.trim());
    const curMonthlyFreq = await page.$eval('#current-frequency', (el) => el.textContent?.trim());
    const curMonthlySched = await page.$eval('#current-schedule', (el) => el.textContent?.trim());
    assert.strictEqual(curMonthlyAmt, '$300.00');
    assert.strictEqual(curMonthlyFreq, 'Monthly');
    assert.ok(curMonthlySched?.includes('10th'));
    console.log('✓ Monthly schedule saved: $300.00 / Monthly / 10th of each month');

    // =========================================================================
    // TEST 3: Bi-weekly Frequency Tests
    // =========================================================================
    console.log('\n--- TEST 3: Bi-weekly Frequency Behavior ---');
    console.log('10. Selecting Bi-weekly frequency...');
    await page.click('#freq-biweekly');

    // 1. Weekday selector appears (and day-of-month is gone)
    await page.waitForSelector('#schedule-day-of-week', { timeout: 5000 });
    const isDayOfMonthGone = await page.$('#schedule-day-of-month');
    assert.strictEqual(isDayOfMonthGone, null, 'Day of month selector must not appear for Bi-weekly');

    const weekdayOptions = await page.$$eval('#schedule-day-of-week option', (opts) =>
      opts.map((o) => o.textContent?.trim())
    );
    assert.strictEqual(weekdayOptions.length, 7, 'Must have 7 days of week');
    console.log('✓ Weekday selector displayed for Bi-weekly');

    // 2. Calculation uses 26 payments/year
    const robertBiweeklyMin = calculateScheduledMinimum(11200, 5.75, 'BIWEEKLY');
    const formattedMinBiweekly = formatCurrency(robertBiweeklyMin);
    const minTextBiweekly = await page.$eval('#minimum-payment-display', (el) => el.textContent || '');
    assert.ok(
      minTextBiweekly.includes(formattedMinBiweekly),
      `Bi-weekly minimum must display ${formattedMinBiweekly} (26 payments/yr), got ${minTextBiweekly}`
    );
    console.log(`✓ Bi-weekly minimum calculated using 26 payments/year: ${formattedMinBiweekly}`);

    // Save Bi-weekly schedule
    console.log('11. Saving Bi-weekly schedule with $150.00 on Every Wednesday...');
    await page.select('#schedule-day-of-week', 'WEDNESDAY');
    await clearAndType(page, '#payment-amount', '150.00');
    await page.click('button[type="submit"]');

    await page.waitForFunction(() => {
      const el = document.querySelector('#current-frequency');
      return el?.textContent?.trim() === 'Bi-weekly';
    }, { timeout: 6000 });

    const curBiweeklyAmt = await page.$eval('#current-payment-amount', (el) => el.textContent?.trim());
    const curBiweeklySched = await page.$eval('#current-schedule', (el) => el.textContent?.trim());
    assert.strictEqual(curBiweeklyAmt, '$150.00');
    assert.ok(curBiweeklySched?.includes('Wednesday'));
    console.log('✓ Bi-weekly schedule saved: $150.00 / Bi-weekly / Every Wednesday');

    // =========================================================================
    // TEST 4: Weekly Frequency Tests
    // =========================================================================
    console.log('\n--- TEST 4: Weekly Frequency Behavior ---');
    console.log('12. Selecting Weekly frequency...');
    await page.click('#freq-weekly');

    // 1. Weekday selector
    await page.waitForSelector('#schedule-day-of-week', { timeout: 5000 });

    // 2. Calculation uses 52 payments/year
    const robertWeeklyMin = calculateScheduledMinimum(11200, 5.75, 'WEEKLY');
    const formattedMinWeekly = formatCurrency(robertWeeklyMin);
    const minTextWeekly = await page.$eval('#minimum-payment-display', (el) => el.textContent || '');
    assert.ok(
      minTextWeekly.includes(formattedMinWeekly),
      `Weekly minimum must display ${formattedMinWeekly} (52 payments/yr), got ${minTextWeekly}`
    );
    console.log(`✓ Weekly minimum calculated using 52 payments/year: ${formattedMinWeekly}`);

    // Save Weekly schedule
    console.log('13. Saving Weekly schedule with $75.00 on Every Friday...');
    await page.select('#schedule-day-of-week', 'FRIDAY');
    await clearAndType(page, '#payment-amount', '75.00');
    await page.click('button[type="submit"]');

    await page.waitForFunction(() => {
      const el = document.querySelector('#current-frequency');
      return el?.textContent?.trim() === 'Weekly';
    }, { timeout: 6000 });

    const curWeeklyAmt = await page.$eval('#current-payment-amount', (el) => el.textContent?.trim());
    const curWeeklySched = await page.$eval('#current-schedule', (el) => el.textContent?.trim());
    assert.strictEqual(curWeeklyAmt, '$75.00');
    assert.ok(curWeeklySched?.includes('Friday'));
    console.log('✓ Weekly schedule saved: $75.00 / Weekly / Every Friday');

    // =========================================================================
    // TEST 5: Refresh preserves it
    // =========================================================================
    console.log('\n--- TEST 5: Persistence Across Refresh ---');
    console.log('14. Reloading /customer/payments...');
    await page.reload({ waitUntil: 'networkidle0' });

    await page.waitForSelector('#current-payment-amount', { timeout: 5000 });
    const reloadedAmt = await page.$eval('#current-payment-amount', (el) => el.textContent?.trim());
    const reloadedFreq = await page.$eval('#current-frequency', (el) => el.textContent?.trim());
    const reloadedSched = await page.$eval('#current-schedule', (el) => el.textContent?.trim());
    assert.strictEqual(reloadedAmt, '$75.00');
    assert.strictEqual(reloadedFreq, 'Weekly');
    assert.ok(reloadedSched?.includes('Friday'));
    console.log('✓ Schedule survives page refresh in localStorage');

    // =========================================================================
    // TEST 6: Saved schedule appears in My Loan
    // =========================================================================
    console.log('\n--- TEST 6: Verify Saved Schedule in My Loan Page ---');
    console.log('15. Navigating to /customer/loan...');
    await page.goto(`${BASE_URL}/customer/loan`, { waitUntil: 'networkidle0' });

    await page.waitForSelector('.tabular-nums', { timeout: 6000 });
    const myLoanContent = await page.$eval('main', (el) => el.textContent || '');
    assert.ok(myLoanContent.includes('$75.00'), 'My Loan displays payment amount $75.00');
    assert.ok(myLoanContent.includes('Weekly'), 'My Loan displays frequency Weekly');
    assert.ok(myLoanContent.includes('Every Friday'), 'My Loan displays schedule Every Friday');
    assert.ok(!myLoanContent.includes('Set up automatic payments to calculate your payoff date'), 'Payoff notice is now resolved');
    console.log('✓ Saved schedule immediately reflected in Customer My Loan page with payoff calculated');

    // =========================================================================
    // TEST 7: Admin Loan Details sees the same updated schedule
    // =========================================================================
    console.log('\n--- TEST 7: Admin Loan Details Sees Updated Schedule ---');
    console.log('16. Logging out customer and logging in as Admin...');
    await logout(page);

    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#admin-username', { timeout: 6000 });
    await clearAndType(page, '#admin-username', 'admin');
    await clearAndType(page, '#admin-password', 'admin123');
    await page.click('button[type="submit"]');

    await page.waitForFunction(() => window.location.pathname === '/admin/loans', { timeout: 8000 });
    console.log('17. Navigating to Robert Davis loan details (/admin/loans/loan-102)...');
    await page.goto(`${BASE_URL}/admin/loans/loan-102`, { waitUntil: 'networkidle0' });

    await page.waitForSelector('main', { timeout: 6000 });
    const adminLoanContent = await page.$eval('main', (el) => el.textContent || '');
    assert.ok(adminLoanContent.includes('$75.00'), 'Admin details displays updated payment $75.00');
    assert.ok(adminLoanContent.includes('Weekly'), 'Admin details displays frequency Weekly');
    assert.ok(adminLoanContent.includes('Friday'), 'Admin details displays schedule day Friday');
    console.log('✓ Admin Loan Details displays the exact same updated schedule ($75.00 / Weekly / Friday)');

    console.log('\n=== ALL AUTOMATIC PAYMENTS TESTS PASSED! ===');
    process.exit(0);
  } finally {
    if (browser) await browser.close();
    if (viteProc) {
      spawn('taskkill', ['/pid', String(viteProc.pid), '/f', '/t']);
    }
  }
}

runAutomaticPaymentsTests().catch((err) => {
  console.error('Customer Automatic Payments tests failed:', err);
  process.exit(1);
});
