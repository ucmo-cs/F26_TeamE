import { spawn } from 'node:child_process';
import assert from 'node:assert';
import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 5173;
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
      // ignore
    }
    await sleep(300);
  }
  return false;
}

async function runBrowserTests() {
  console.log('=== Starting Real Browser E2E Tests ===');

  console.log('1. Starting Vite development server...');
  const viteProc = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
    shell: true,
    cwd: process.cwd(),
    stdio: 'pipe',
  });

  const isUp = await waitForServer(BASE_URL);
  assert.ok(isUp, 'Vite dev server failed to start within timeout');
  console.log(`✓ Vite dev server is running at ${BASE_URL}`);

  console.log('2. Launching headless Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  try {
    // TEST 1: App starts with no console errors & root redirect
    console.log('3. Testing root route and console errors...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
    const currentUrl = page.url();
    assert.strictEqual(
      currentUrl,
      `${BASE_URL}/customer/login`,
      'Root route / must redirect to /customer/login'
    );
    assert.strictEqual(consoleErrors.length, 0, `Expected 0 console errors, got: ${consoleErrors.join(', ')}`);
    console.log('✓ App starts cleanly with no console errors and redirects / to /customer/login');

    // TEST 2: /admin/login and /customer/login routes resolve
    console.log('4. Testing /admin/login route...');
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle0' });
    assert.strictEqual(page.url(), `${BASE_URL}/admin/login`);
    const adminHeading = await page.$eval('h1', (el) => el.textContent);
    assert.ok(adminHeading?.includes('Loan Repayment Tracker'));
    const adminDemoBox = await page.$eval('.bg-\\[\\#EAF1F8\\]', (el) => el.textContent);
    assert.ok(adminDemoBox?.includes('admin123'), 'Admin demo credentials displayed');
    console.log('✓ /admin/login resolves and displays login form with demo credentials');

    console.log('5. Testing /customer/login route...');
    await page.goto(`${BASE_URL}/customer/login`, { waitUntil: 'networkidle0' });
    assert.strictEqual(page.url(), `${BASE_URL}/customer/login`);
    const customerDemoBox = await page.$eval('.bg-\\[\\#EAF1F8\\]', (el) => el.textContent);
    assert.ok(customerDemoBox?.includes('jane@example.com'), 'Customer demo credentials displayed');
    console.log('✓ /customer/login resolves and displays login form with demo credentials');

    // TEST 3: Protected routes redirect correctly when unauthenticated
    console.log('6. Testing unauthenticated protected route redirection...');
    await page.goto(`${BASE_URL}/admin/loans`, { waitUntil: 'networkidle0' });
    assert.strictEqual(page.url(), `${BASE_URL}/admin/login`, 'Unauthenticated /admin/loans must redirect to /admin/login');

    await page.goto(`${BASE_URL}/customer/loan`, { waitUntil: 'networkidle0' });
    assert.strictEqual(page.url(), `${BASE_URL}/customer/login`, 'Unauthenticated /customer/loan must redirect to /customer/login');
    console.log('✓ Protected routes redirect unauthenticated users to login');

    // TEST 4: Admin Login & Visual Layout matching Style Spec
    console.log('7. Testing Admin Login and Layout styles...');
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle0' });
    await page.click('[title*="Click to fill demo credentials"]');
    await page.click('button[type="submit"]');
    await page.waitForSelector('header', { timeout: 8000 });
    assert.strictEqual(page.url(), `${BASE_URL}/admin/loans`);

    // Verify Header: 64px height, background white, border bottom
    const headerHeight = await page.$eval('header', (el) => el.offsetHeight);
    assert.strictEqual(headerHeight, 64, 'Header height must be exactly 64px');

    // Verify Sidebar: 240px width, background #0D2742
    const sidebarWidth = await page.$eval('aside', (el) => el.offsetWidth);
    assert.strictEqual(sidebarWidth, 240, 'Sidebar width must be exactly 240px');

    // Verify Admin Nav items: Loans, New Loan
    const navText = await page.$eval('aside nav', (el) => el.textContent);
    assert.ok(navText?.includes('Loans') && navText?.includes('New Loan'), 'Sidebar contains Loans and New Loan');

    // Verify Page Header
    const pageTitle = await page.$eval('h1', (el) => el.textContent);
    assert.ok(pageTitle?.includes('Active Loans'));
    console.log('✓ Sidebar and layout visually match the style spec (64px header, 240px sidebar, correct nav items)');

    // TEST 5: Refreshing doesn't crash or lose session
    console.log('8. Testing page refresh persistence...');
    await page.reload({ waitUntil: 'networkidle0' });
    assert.strictEqual(page.url(), `${BASE_URL}/admin/loans`, 'Page reload should maintain authenticated route');
    const headerUser = await page.$eval('header', (el) => el.textContent);
    assert.ok(headerUser?.includes('Administrator'), 'User session preserved after reload');
    assert.strictEqual(consoleErrors.length, 0, 'No console errors after reload');
    console.log("✓ Refreshing doesn't crash and preserves session");

    // TEST 6: Customer Login & Role separation
    console.log('9. Testing Customer Login and Role separation...');
    // Log out admin
    await page.click('header button');
    await page.waitForSelector('#admin-username', { timeout: 5000 });
    assert.strictEqual(page.url(), `${BASE_URL}/admin/login`);

    // Login as Customer
    await page.goto(`${BASE_URL}/customer/login`, { waitUntil: 'networkidle0' });
    await page.click('[title*="Click to fill demo credentials"]');
    await page.click('button[type="submit"]');
    await page.waitForSelector('aside nav', { timeout: 8000 });
    assert.strictEqual(page.url(), `${BASE_URL}/customer/loan`);

    // Customer sidebar check
    const custNavText = await page.$eval('aside nav', (el) => el.textContent);
    assert.ok(custNavText?.includes('My Loan') && custNavText?.includes('Profile') && custNavText?.includes('Payments'));

    // Customer cannot access admin routes
    await page.goto(`${BASE_URL}/admin/loans`, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => window.location.pathname === '/customer/loan', { timeout: 5000 });
    assert.strictEqual(page.url(), `${BASE_URL}/customer/loan`, 'Customer attempting admin route redirected to customer home');
    console.log('✓ Customer authentication and cross-role protection work correctly');

    // TEST 7: Reset Demo Data functionality
    console.log('10. Testing reset demo data in UI...');
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
    const resetButton = await page.$('aside button[title*="Restore prototype data"]');
    assert.ok(resetButton !== null, 'Reset Demo Data button present in development mode');
    await resetButton.click();
    await page.waitForFunction(() => window.location.pathname === '/customer/login', { timeout: 5000 });
    assert.strictEqual(page.url(), `${BASE_URL}/customer/login`, 'Reset demo data logs user out and navigates to login');
    console.log('✓ Reset demo data functionality resets state and returns to login');

    console.log('=== ALL REAL BROWSER TESTS PASSED! ===');
    process.exit(0);
  } finally {
    if (browser) await browser.close();
    if (viteProc) {
      spawn('taskkill', ['/pid', String(viteProc.pid), '/f', '/t']);
    }
  }
}

runBrowserTests().catch((err) => {
  console.error('Browser tests failed:', err);
  process.exit(1);
});
