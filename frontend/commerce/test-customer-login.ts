import { spawn } from 'node:child_process';
import assert from 'node:assert';
import puppeteer, { Page } from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 5176; // Use port 5176
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

async function runCustomerLoginTests() {
  console.log('=== Starting Customer Login Verification Tests ===');

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

    // Clear state
    await page.goto(`${BASE_URL}/customer/login`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });

    // ----------------------------------------------------
    // TEST 1: Bad password & Invalid credentials
    // ----------------------------------------------------
    console.log('3. Testing bad password error handling...');
    await page.waitForSelector('#customer-email');
    await clearAndType(page, '#customer-email', 'jane@example.com');
    await clearAndType(page, '#customer-password', 'wrongPassword123');
    await page.click('button[type="submit"]');

    await page.waitForSelector('[role="alert"]', { timeout: 6000 });
    const alertText = await page.$eval('[role="alert"]', (el) => el.textContent?.trim());
    assert.strictEqual(
      alertText,
      'Invalid email or password.',
      'Alert must display exact spec text "Invalid email or password."'
    );
    assert.strictEqual(page.url(), `${BASE_URL}/customer/login`, 'Must remain on /customer/login');
    console.log('✓ Bad password shows "Invalid email or password." error and stays on /customer/login');

    console.log('4. Testing non-existent customer error handling...');
    await clearAndType(page, '#customer-email', 'unknown.user@example.com');
    await clearAndType(page, '#customer-password', 'customer123');
    await page.click('button[type="submit"]');

    await page.waitForSelector('[role="alert"]', { timeout: 6000 });
    const alertTextUnknown = await page.$eval('[role="alert"]', (el) => el.textContent?.trim());
    assert.strictEqual(alertTextUnknown, 'Invalid email or password.');
    console.log('✓ Unknown customer email shows "Invalid email or password."');

    // ----------------------------------------------------
    // TEST 2: Demo credentials auto-fill & login (jane@example.com / customer123)
    // ----------------------------------------------------
    console.log('5. Testing demo credentials auto-fill and login for jane@example.com...');
    await page.click('[title*="Click to fill demo credentials"]');

    const emailVal = await page.$eval('#customer-email', (el: HTMLInputElement) => el.value);
    const passVal = await page.$eval('#customer-password', (el: HTMLInputElement) => el.value);
    assert.strictEqual(emailVal, 'jane@example.com', 'Auto-fill must insert jane@example.com');
    assert.strictEqual(passVal, 'customer123', 'Auto-fill must insert customer123');
    console.log('✓ Demo credentials box successfully auto-fills fields');

    await page.click('button[type="submit"]');

    // Should navigate to /customer/loan
    await page.waitForFunction(() => window.location.pathname === '/customer/loan', { timeout: 8000 });
    assert.strictEqual(page.url(), `${BASE_URL}/customer/loan`, 'Redirects to /customer/loan on login success');

    // Header verification
    await page.waitForSelector('header', { timeout: 5000 });
    const headerText = await page.$eval('header', (el) => el.textContent || '');
    assert.ok(headerText.includes('Jane Smith'), 'Header displays customer name "Jane Smith"');
    assert.ok(headerText.includes('Customer Account'), 'Header displays role "Customer Account"');
    assert.ok(headerText.includes('Log Out'), 'Header displays "Log Out" button');

    // Loan details verification
    await page.waitForSelector('.tabular-nums', { timeout: 6000 });
    const pageContent = await page.$eval('main', (el) => el.textContent || '');
    assert.ok(pageContent.includes('$18,420.32'), 'Jane Smith loan displays remaining balance $18,420.32');
    console.log('✓ jane@example.com / customer123 logs in, shows customer header, and loads loan!');

    // ----------------------------------------------------
    // TEST 3: Refresh session persistence
    // ----------------------------------------------------
    console.log('6. Testing customer session persistence across refresh...');
    await page.reload({ waitUntil: 'networkidle0' });
    assert.strictEqual(page.url(), `${BASE_URL}/customer/loan`, 'Page remains on /customer/loan after refresh');

    const headerAfterRefresh = await page.$eval('header', (el) => el.textContent || '');
    assert.ok(headerAfterRefresh.includes('Jane Smith'), 'Customer session persists across refresh');
    console.log('✓ Refresh keeps customer logged in with valid session');

    // ----------------------------------------------------
    // TEST 4: Customer cannot access /admin/loans
    // ----------------------------------------------------
    console.log('7. Testing customer cannot access admin routes (/admin/loans)...');
    await page.goto(`${BASE_URL}/admin/loans`, { waitUntil: 'networkidle0' });
    assert.strictEqual(
      page.url(),
      `${BASE_URL}/customer/loan`,
      'Customer navigating to /admin/loans must be redirected back to /customer/loan'
    );

    await page.goto(`${BASE_URL}/admin/loans/new`, { waitUntil: 'networkidle0' });
    assert.strictEqual(
      page.url(),
      `${BASE_URL}/customer/loan`,
      'Customer navigating to /admin/loans/new must be redirected back to /customer/loan'
    );

    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle0' });
    assert.strictEqual(
      page.url(),
      `${BASE_URL}/customer/loan`,
      'Customer navigating to /admin must be redirected back to /customer/loan'
    );
    console.log('✓ Customer cannot access /admin routes and is safely redirected back to /customer/loan');

    // ----------------------------------------------------
    // TEST 5: Customer logout
    // ----------------------------------------------------
    console.log('8. Testing customer logout...');
    const logoutBtn = await page.$('header button');
    assert.ok(logoutBtn !== null, 'Logout button present');
    await logoutBtn.click();

    await page.waitForSelector('#customer-email', { timeout: 6000 });
    assert.strictEqual(page.url(), `${BASE_URL}/customer/login`, 'Customer logout navigates to /customer/login');

    // Verify customer cannot access /customer/loan now
    await page.goto(`${BASE_URL}/customer/loan`, { waitUntil: 'networkidle0' });
    assert.strictEqual(
      page.url(),
      `${BASE_URL}/customer/login`,
      'Accessing /customer/loan after logout redirects to /customer/login'
    );
    console.log('✓ Customer logout successfully clears session and protects routes');

    // ----------------------------------------------------
    // TEST 6: Dynamically created customer through Admin
    // ----------------------------------------------------
    console.log('9. Creating a new customer through Admin Portal...');
    // Log into Admin
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle0' });
    await clearAndType(page, '#admin-username', 'admin');
    await clearAndType(page, '#admin-password', 'admin123');
    await page.click('button[type="submit"]');

    await page.waitForFunction(() => window.location.pathname === '/admin/loans', { timeout: 8000 });

    // Navigate to Create Loan
    await page.goto(`${BASE_URL}/admin/loans/new`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#new-customer-name', { timeout: 5000 });

    const dynamicCustomer = {
      name: 'Diana Prince',
      email: 'diana.prince@themyscira.org',
      phone: '(555) 987-6543',
      loanDate: '2026-10-07',
      originalAmount: '60000',
      annualInterestRate: '4.75',
    };

    await clearAndType(page, '#new-customer-name', dynamicCustomer.name);
    await clearAndType(page, '#new-customer-email', dynamicCustomer.email);
    await clearAndType(page, '#new-customer-phone', dynamicCustomer.phone);
    await clearAndType(page, '#new-loan-date', dynamicCustomer.loanDate);
    await clearAndType(page, '#new-original-amount', dynamicCustomer.originalAmount);
    await clearAndType(page, '#new-interest-rate', dynamicCustomer.annualInterestRate);

    await page.click('button[type="submit"]');

    // Wait for redirect to admin details page
    await page.waitForFunction(() => window.location.pathname.startsWith('/admin/loans/loan-'), { timeout: 8000 });
    console.log('✓ Dynamically created loan for Diana Prince in Admin');

    // Admin logs out
    const adminLogoutBtn = await page.$('header button');
    assert.ok(adminLogoutBtn !== null);
    await adminLogoutBtn.click();
    await page.waitForSelector('#admin-username', { timeout: 5000 });

    // ----------------------------------------------------
    // TEST 7: Dynamically created customer logs into Customer Portal
    // ----------------------------------------------------
    console.log('10. Testing dynamically created customer login...');
    await page.goto(`${BASE_URL}/customer/login`, { waitUntil: 'networkidle0' });
    await clearAndType(page, '#customer-email', dynamicCustomer.email);
    await clearAndType(page, '#customer-password', 'customer123');
    await page.click('button[type="submit"]');

    await page.waitForFunction(() => window.location.pathname === '/customer/loan', { timeout: 8000 });
    assert.strictEqual(page.url(), `${BASE_URL}/customer/loan`, 'Diana Prince logged into /customer/loan');

    // Wait for authenticated header to mount
    await page.waitForSelector('header', { timeout: 6000 });

    // Check header displays Diana Prince
    const dianaHeader = await page.$eval('header', (el) => el.textContent || '');
    assert.ok(dianaHeader.includes('Diana Prince'), 'Header displays dynamic customer name "Diana Prince"');

    // Wait for loan details
    await page.waitForSelector('.tabular-nums', { timeout: 6000 });
    const dianaContent = await page.$eval('main', (el) => el.textContent || '');
    assert.ok(dianaContent.includes('$60,000.00'), 'Remaining balance shows $60,000.00');
    assert.ok(dianaContent.includes('4.75%'), 'Interest rate shows 4.75%');
    console.log('✓ Dynamically created customer Diana Prince successfully logs in with customer123 and loads her loan!');

    console.log('=== ALL CUSTOMER LOGIN TESTS PASSED! ===');
  } finally {
    if (browser) await browser.close();
    if (viteProc) {
      spawn('taskkill', ['/pid', String(viteProc.pid), '/f', '/t']);
    }
  }
}

runCustomerLoginTests().catch((err) => {
  console.error('Customer login tests failed:', err);
  process.exit(1);
});
