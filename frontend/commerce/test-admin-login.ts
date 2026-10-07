import { spawn } from 'node:child_process';
import assert from 'node:assert';
import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 5174; // Use dedicated port 5174 to avoid any collision
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

async function runAdminLoginTests() {
  console.log('=== Starting Admin Login Verification Tests ===');

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
    page.on('console', (msg) => console.log('  [Browser]', msg.text()));
    page.on('pageerror', (err) => console.error('  [PageError]', err));

    // Clear localStorage before start
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });

    // TEST 1: Bad credentials fail
    console.log('3. Testing bad credentials failure...');
    await page.waitForSelector('#admin-username');
    await page.focus('#admin-username');
    await page.keyboard.type('admin');
    await page.focus('#admin-password');
    await page.keyboard.type('wrongpass123');

    const uVal = await page.$eval('#admin-username', (el: HTMLInputElement) => el.value);
    const pVal = await page.$eval('#admin-password', (el: HTMLInputElement) => el.value);
    console.log(`  Inputs filled: username="${uVal}", password="${pVal}"`);

    await page.click('button[type="submit"]');

    // Wait for error alert
    await page.waitForSelector('[role="alert"]', { timeout: 6000 });
    const errorText = await page.$eval('[role="alert"]', (el) => el.textContent);
    assert.ok(
      errorText?.includes('Invalid username or password.'),
      `Expected "Invalid username or password.", got: "${errorText}"`
    );
    assert.strictEqual(page.url(), `${BASE_URL}/admin/login`, 'Must remain on /admin/login');
    console.log('✓ Bad credentials fail with "Invalid username or password." and remain on /admin/login');

    // TEST 2: admin / admin123 works
    console.log('4. Testing admin / admin123 login success...');
    // Click demo credentials box to auto-fill
    await page.click('[title*="Click to fill demo credentials"]');
    const uFilled = await page.$eval('#admin-username', (el: HTMLInputElement) => el.value);
    const pFilled = await page.$eval('#admin-password', (el: HTMLInputElement) => el.value);
    assert.strictEqual(uFilled, 'admin', 'Demo credentials box must fill username');
    assert.strictEqual(pFilled, 'admin123', 'Demo credentials box must fill password');
    console.log('✓ Demo credentials box auto-fills admin / admin123');

    await page.click('button[type="submit"]');

    // Wait for redirect to /admin/loans and header to appear
    await page.waitForSelector('header', { timeout: 8000 });
    assert.strictEqual(page.url(), `${BASE_URL}/admin/loans`, 'Should navigate to /admin/loans on success');

    const headerText = await page.$eval('header', (el) => el.textContent);
    assert.ok(headerText?.includes('System Administrator'), 'Header displays admin user name');
    assert.ok(headerText?.includes('Administrator'), 'Header displays role');
    console.log('✓ admin / admin123 successfully logs in and redirects to /admin/loans');

    // TEST 3: Refresh keeps you logged in
    console.log('5. Testing page refresh persistence...');
    await page.reload({ waitUntil: 'networkidle0' });
    assert.strictEqual(page.url(), `${BASE_URL}/admin/loans`, 'Remains on /admin/loans after reload');
    const reloadedHeader = await page.$eval('header', (el) => el.textContent);
    assert.ok(reloadedHeader?.includes('System Administrator'), 'Admin session retained after reload');
    console.log('✓ Refresh keeps you logged in');

    // TEST 4: Customer routes are still inaccessible as admin
    console.log('6. Testing customer routes are inaccessible as admin...');
    await page.goto(`${BASE_URL}/customer/loan`, { waitUntil: 'networkidle0' });
    assert.strictEqual(page.url(), `${BASE_URL}/admin/loans`, '/customer/loan must redirect back to /admin/loans');

    await page.goto(`${BASE_URL}/customer/profile`, { waitUntil: 'networkidle0' });
    assert.strictEqual(page.url(), `${BASE_URL}/admin/loans`, '/customer/profile must redirect back to /admin/loans');

    await page.goto(`${BASE_URL}/customer/payments`, { waitUntil: 'networkidle0' });
    assert.strictEqual(page.url(), `${BASE_URL}/admin/loans`, '/customer/payments must redirect back to /admin/loans');
    console.log('✓ Customer routes are inaccessible as admin (redirected back to /admin/loans)');

    // TEST 5: Logout returns to admin login
    console.log('7. Testing admin logout...');
    const logoutBtn = await page.$('header button');
    assert.ok(logoutBtn !== null, 'Logout button present in header');
    await logoutBtn.click();

    await page.waitForSelector('#admin-username', { timeout: 5000 });
    assert.strictEqual(page.url(), `${BASE_URL}/admin/login`, 'Logout must navigate to /admin/login');

    // Verify navigating to protected route now kicks back to login
    await page.goto(`${BASE_URL}/admin/loans`, { waitUntil: 'networkidle0' });
    assert.strictEqual(page.url(), `${BASE_URL}/admin/login`, 'Accessing /admin/loans after logout redirects to /admin/login');
    console.log('✓ Logout successfully clears session and returns to /admin/login');

    console.log('=== ALL ADMIN LOGIN TESTS PASSED! ===');
    process.exit(0);
  } finally {
    if (browser) await browser.close();
    if (viteProc) {
      spawn('taskkill', ['/pid', String(viteProc.pid), '/f', '/t']);
    }
  }
}

runAdminLoginTests().catch((err) => {
  console.error('Admin login tests failed:', err);
  process.exit(1);
});
