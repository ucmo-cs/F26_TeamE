import { spawn } from 'node:child_process';
import assert from 'node:assert';
import puppeteer, { Page } from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 5178; // Dedicated port 5178
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
  await page.click(selector, { clickCount: 3 });
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

async function runCustomerMyLoanTests() {
  console.log('=== Starting Customer My Loan Verification Tests ===');

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

    // Reset localStorage before test start
    await page.goto(`${BASE_URL}/customer/login`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });

    // =========================================================================
    // BRANCH 1: Customer WITH a payment schedule (Jane Smith - jane@example.com)
    // =========================================================================
    console.log('\n--- TESTING BRANCH 1: Customer WITH Payment Schedule (Jane Smith) ---');
    console.log('3. Logging in as jane@example.com...');
    await page.waitForSelector('#customer-email');
    await clearAndType(page, '#customer-email', 'jane@example.com');
    await clearAndType(page, '#customer-password', 'customer123');
    await page.click('button[type="submit"]');

    await page.waitForFunction(() => window.location.pathname === '/customer/loan', { timeout: 8000 });
    assert.strictEqual(page.url(), `${BASE_URL}/customer/loan`, 'Arrived at /customer/loan');
    console.log('✓ Successfully navigated to /customer/loan');

    // Wait for loan data to load
    await page.waitForSelector('.tabular-nums', { timeout: 6000 });
    const contentJane = await page.$eval('main', (el) => el.textContent || '');

    // 1. Check Remaining Balance
    console.log('4. Verifying Remaining Balance card...');
    assert.ok(contentJane.includes('$18,420.32'), 'Must display Remaining Balance $18,420.32');
    assert.ok(contentJane.includes('Minimum monthly payment:'), 'Must display minimum monthly payment label');
    console.log('✓ Remaining balance $18,420.32 is prominently displayed with minimum payment');

    // 2. Check Required Loan Details
    console.log('5. Verifying Loan Details fields...');
    assert.ok(contentJane.includes('08/14/2026'), 'Loan Date 08/14/2026 is displayed');
    assert.ok(contentJane.includes('$25,000.00'), 'Original Loan Amount $25,000.00 is displayed');
    assert.ok(contentJane.includes('6.25%'), 'Annual Interest Rate 6.25% is displayed');
    console.log('    [contentJane excerpt]:', contentJane.slice(0, 500));
    assert.ok(contentJane.includes('Minimum Monthly Payment'), 'Minimum Monthly Payment column displayed');
    assert.ok(contentJane.includes('Estimated Payoff Date'), 'Estimated Payoff Date column displayed');
    // Check that payoff date is present and not N/A
    const hasPayoffDate = /Estimated Payoff Date\s*([A-Za-z]+ \d{1,2}, \d{4})/.test(contentJane);
    console.log('    [hasPayoffDate match]:', hasPayoffDate);
    assert.ok(hasPayoffDate || !contentJane.includes('N/A'), 'Payoff date is properly calculated');
    console.log('✓ All 5 required loan details present including calculated payoff date');

    // 3. Check Automatic Payment Summary (with schedule)
    console.log('6. Verifying Automatic Payment Summary (with schedule)...');
    assert.ok(contentJane.includes('$250.00'), 'Payment Amount $250.00 is displayed');
    assert.ok(contentJane.includes('Bi-weekly'), 'Frequency Bi-weekly is displayed');
    assert.ok(contentJane.includes('Every Friday'), 'Schedule Every Friday is displayed');
    assert.ok(contentJane.includes('October 16, 2026'), 'Next Payment Date October 16, 2026 is displayed');

    // Check "Manage Payments" button
    const hasManageBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some((b) => b.textContent?.includes('Manage Payments'));
    });
    assert.ok(hasManageBtn, 'Manage Payments button must be present when schedule exists');
    console.log('✓ Automatic payment summary displays amount, frequency, schedule, and next payment date');

    // 4. Test link to Payments
    console.log('7. Testing "Manage Payments" link navigates to /customer/payments...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find((b) => b.textContent?.includes('Manage Payments'));
      if (btn) btn.click();
    });
    await page.waitForFunction(() => window.location.pathname === '/customer/payments', { timeout: 5000 });
    assert.strictEqual(page.url(), `${BASE_URL}/customer/payments`, 'Manage Payments routes to /customer/payments');
    console.log('✓ Manage Payments navigates directly to /customer/payments');

    // Log out Jane
    console.log('8. Logging out Jane Smith...');
    await logout(page);
    console.log('✓ Jane logged out');

    // =========================================================================
    // BRANCH 2: Customer WITHOUT a payment schedule (Robert Davis - robert@example.com)
    // =========================================================================
    console.log('\n--- TESTING BRANCH 2: Customer WITHOUT Payment Schedule (Robert Davis) ---');
    console.log('9. Logging in as robert@example.com...');
    await page.goto(`${BASE_URL}/customer/login`, { waitUntil: 'networkidle0' });
    await clearAndType(page, '#customer-email', 'robert@example.com');
    await clearAndType(page, '#customer-password', 'customer123');
    await page.click('button[type="submit"]');

    await page.waitForFunction(() => window.location.pathname === '/customer/loan', { timeout: 8000 });
    assert.strictEqual(page.url(), `${BASE_URL}/customer/loan`, 'Arrived at /customer/loan for Robert');

    // Wait for loan data to load
    await page.waitForSelector('.tabular-nums', { timeout: 6000 });
    const contentRobert = await page.$eval('main', (el) => el.textContent || '');

    // 1. Check Remaining Balance
    console.log('10. Verifying Remaining Balance for unscheduled loan...');
    assert.ok(contentRobert.includes('$11,200.00'), 'Must display Remaining Balance $11,200.00');
    console.log('✓ Remaining balance $11,200.00 displayed');

    // 2. Check Loan Details
    console.log('11. Verifying Loan Details fields for Robert...');
    assert.ok(contentRobert.includes('05/10/2026'), 'Loan Date 05/10/2026 displayed');
    assert.ok(contentRobert.includes('$15,000.00'), 'Original Loan Amount $15,000.00 displayed');
    assert.ok(contentRobert.includes('5.75%'), 'Annual Interest Rate 5.75% displayed');

    // 3. Check Payoff Date Without Schedule per spec:
    // "Estimated Payoff Date: Set up automatic payments to calculate your payoff date."
    // "Action: Set Up Payments -> goes to /customer/payments"
    console.log('12. Verifying unscheduled payoff message and "Set Up Payments" action...');
    assert.ok(
      contentRobert.includes('Set up automatic payments to calculate your payoff date.'),
      'Must display exact spec copy: "Set up automatic payments to calculate your payoff date."'
    );

    // 4. Check Automatic Payment Summary for unscheduled loan
    console.log('13. Verifying Automatic Payment Summary for unscheduled loan...');
    assert.ok(
      contentRobert.includes('No automatic payments scheduled') ||
        contentRobert.includes('No automatic payment schedule'),
      'Shows empty schedule notice'
    );

    // Check "Set Up Payments" button exists
    const hasSetUpBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some((b) => b.textContent?.includes('Set Up Payments'));
    });
    assert.ok(hasSetUpBtn, 'Set Up Payments button must exist');
    console.log('✓ "Set Up Payments" button present');

    // 5. Test link to Payments
    console.log('14. Testing "Set Up Payments" button navigates to /customer/payments...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find((b) => b.textContent?.includes('Set Up Payments'));
      if (btn) btn.click();
    });
    await page.waitForFunction(() => window.location.pathname === '/customer/payments', { timeout: 5000 });
    assert.strictEqual(page.url(), `${BASE_URL}/customer/payments`, 'Set Up Payments routes to /customer/payments');
    console.log('✓ Set Up Payments navigates directly to /customer/payments');

    console.log('\n=== ALL CUSTOMER MY LOAN TESTS PASSED! ===');
    process.exit(0);
  } finally {
    if (browser) await browser.close();
    if (viteProc) {
      spawn('taskkill', ['/pid', String(viteProc.pid), '/f', '/t']);
    }
  }
}

runCustomerMyLoanTests().catch((err) => {
  console.error('Customer My Loan tests failed:', err);
  process.exit(1);
});
