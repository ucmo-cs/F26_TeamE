import { spawn } from 'node:child_process';
import assert from 'node:assert';
import puppeteer, { Page } from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 5180; // Dedicated port 5180
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

async function runCustomerProfileTests() {
  console.log('=== Starting Customer Profile Verification Tests ===');

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

    // ----------------------------------------------------
    // TEST 1: Login as Jane Smith & Navigate to /customer/profile
    // ----------------------------------------------------
    console.log('3. Logging in as jane@example.com...');
    await page.waitForSelector('#customer-email');
    await clearAndType(page, '#customer-email', 'jane@example.com');
    await clearAndType(page, '#customer-password', 'customer123');
    await page.click('button[type="submit"]');

    await page.waitForFunction(() => window.location.pathname === '/customer/loan', { timeout: 8000 });
    await page.goto(`${BASE_URL}/customer/profile`, { waitUntil: 'networkidle0' });
    assert.strictEqual(page.url(), `${BASE_URL}/customer/profile`, 'Arrived at /customer/profile');
    console.log('✓ Successfully arrived at /customer/profile');

    // ----------------------------------------------------
    // TEST 2: Contact details save through refresh
    // ----------------------------------------------------
    console.log('4. Testing contact details update and refresh persistence...');
    await page.waitForSelector('#personal-name');
    const nameInitial = await page.$eval('#personal-name', (el: HTMLInputElement) => el.value);
    assert.strictEqual(nameInitial, 'Jane Smith', 'Initial name is Jane Smith');

    // Change Name and Phone
    await clearAndType(page, '#personal-name', 'Jane Doe-Smith');
    await clearAndType(page, '#personal-phone', '(555) 999-8877');

    // Save Personal Information
    await page.click('button[type="submit"]');
    await page.waitForSelector('[role="alert"]', { timeout: 6000 });
    const successAlert = await page.$eval('[role="alert"]', (el) => el.textContent?.trim());
    assert.strictEqual(
      successAlert,
      'Personal information saved.',
      'Success alert must state "Personal information saved."'
    );
    console.log('✓ Personal info saved alert displayed');

    // Reload page to verify persistence through refresh
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('#personal-name');
    const nameAfterReload = await page.$eval('#personal-name', (el: HTMLInputElement) => el.value);
    const phoneAfterReload = await page.$eval('#personal-phone', (el: HTMLInputElement) => el.value);
    assert.strictEqual(nameAfterReload, 'Jane Doe-Smith', 'Updated name persists across refresh');
    assert.strictEqual(phoneAfterReload, '(555) 999-8877', 'Updated phone persists across refresh');
    console.log('✓ Contact details saved successfully and persist through page refresh');

    // ----------------------------------------------------
    // TEST 3: Changing email changes the customer's login email
    // ----------------------------------------------------
    console.log('5. Testing changing email updates customer login credentials...');
    const newEmail = 'jane.updated@example.com';
    await clearAndType(page, '#personal-email', newEmail);

    // Save Personal Information with new email
    await page.click('button[type="submit"]');
    await page.waitForSelector('[role="alert"]', { timeout: 6000 });
    console.log(`✓ Email updated to ${newEmail}`);

    // Log out customer
    console.log('6. Logging out to test login with old vs new email...');
    await logout(page);

    // Try logging in with OLD email (must fail)
    console.log('7. Verifying OLD email cannot log in...');
    await page.waitForSelector('#customer-email');
    await clearAndType(page, '#customer-email', 'jane@example.com');
    await clearAndType(page, '#customer-password', 'customer123');
    await page.click('button[type="submit"]');

    await page.waitForSelector('[role="alert"]', { timeout: 6000 });
    const oldEmailAlert = await page.$eval('[role="alert"]', (el) => el.textContent?.trim());
    assert.strictEqual(oldEmailAlert, 'Invalid email or password.', 'Old email is rejected');
    console.log('✓ Old email jane@example.com is rejected as expected');

    // Log in with NEW email (must succeed)
    console.log('8. Verifying NEW email logs in successfully with customer123...');
    await clearAndType(page, '#customer-email', newEmail);
    await clearAndType(page, '#customer-password', 'customer123');
    await page.click('button[type="submit"]');

    await page.waitForFunction(() => window.location.pathname === '/customer/loan', { timeout: 8000 });
    assert.strictEqual(page.url(), `${BASE_URL}/customer/loan`, 'Logged in with new email');
    console.log('✓ Customer successfully logged in with updated email!');

    // ----------------------------------------------------
    // TEST 4: Bank numbers accept leading zeroes, saved numbers display masked, replacement works
    // ----------------------------------------------------
    console.log('9. Navigating back to Profile for bank account tests...');
    await page.goto(`${BASE_URL}/customer/profile`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('main');

    // Check existing bank account masking before replacement
    const initialMaskedRouting = await page.$eval('#view-routing-number', (el) => el.textContent?.trim());
    const initialMaskedAccount = await page.$eval('#view-account-number', (el) => el.textContent?.trim());
    assert.ok(initialMaskedRouting?.includes('••••'), 'Routing number is masked');
    assert.ok(initialMaskedAccount?.includes('••••'), 'Account number is masked');
    console.log(`✓ Existing bank account displays masked: ${initialMaskedRouting} / ${initialMaskedAccount}`);

    // Click "Change Bank Account"
    console.log('10. Clicking "Change Bank Account"...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find((b) => b.textContent?.includes('Change Bank Account'));
      if (btn) btn.click();
    });

    await page.waitForSelector('#bank-name', { timeout: 5000 });
    // Replacement form starts with routing/account fields empty per spec
    const routingValInitial = await page.$eval('#bank-routing-number', (el: HTMLInputElement) => el.value);
    const accountValInitial = await page.$eval('#bank-account-number', (el: HTMLInputElement) => el.value);
    assert.strictEqual(routingValInitial, '', 'Replacement form starts with routing number empty');
    assert.strictEqual(accountValInitial, '', 'Replacement form starts with account number empty');
    console.log('✓ Replacement form starts with routing and account fields empty');

    // Enter bank info with leading zeroes
    console.log('11. Entering bank numbers with leading zeroes: "000012345" and "000987654321"...');
    await clearAndType(page, '#bank-name', 'Metro Horizon Bank');
    await page.select('#bank-account-type', 'SAVINGS');
    await clearAndType(page, '#bank-routing-number', '000012345');
    await clearAndType(page, '#bank-account-number', '000987654321');

    const routingInputVal = await page.$eval('#bank-routing-number', (el: HTMLInputElement) => el.value);
    const accountInputVal = await page.$eval('#bank-account-number', (el: HTMLInputElement) => el.value);
    assert.strictEqual(routingInputVal, '000012345', 'Routing number preserved leading zeroes');
    assert.strictEqual(accountInputVal, '000987654321', 'Account number preserved leading zeroes');
    console.log('✓ Bank inputs preserved leading zeroes');

    // Click "Save Bank Account"
    console.log('12. Submitting bank account changes...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find((b) => b.textContent?.includes('Save Bank Account'));
      if (btn) btn.click();
    });

    // Wait for success alert
    await page.waitForFunction(() => {
      const alerts = Array.from(document.querySelectorAll('[role="alert"]'));
      return alerts.some((a) => a.textContent?.includes('Bank account information saved.'));
    }, { timeout: 6000 });
    console.log('✓ Bank account information saved successfully');

    // ----------------------------------------------------
    // TEST 5: Saved bank numbers display masked & raw value is NEVER displayed on normal page
    // ----------------------------------------------------
    console.log('13. Verifying saved bank values display masked...');
    await page.waitForSelector('#view-routing-number', { timeout: 5000 });
    const maskedRouting = await page.$eval('#view-routing-number', (el) => el.textContent?.trim());
    const maskedAccount = await page.$eval('#view-account-number', (el) => el.textContent?.trim());
    const viewBankName = await page.$eval('#view-bank-name', (el) => el.textContent?.trim());
    const viewAccountType = await page.$eval('#view-account-type', (el) => el.textContent?.trim());

    assert.strictEqual(viewBankName, 'Metro Horizon Bank', 'Bank name updated');
    assert.strictEqual(viewAccountType, 'Savings', 'Account type updated');
    assert.strictEqual(maskedRouting, '•••••2345', 'Routing number is masked as •••••2345');
    assert.strictEqual(maskedAccount, '••••••••4321', 'Account number is masked as ••••••••4321');
    console.log(`✓ Masked values display correctly: ${maskedRouting} / ${maskedAccount}`);

    // Check entire page content does NOT leak raw values
    console.log('14. Verifying raw bank numbers are NEVER displayed in normal page DOM...');
    const pageHtml = await page.$eval('main', (el) => el.textContent || '');
    assert.ok(!pageHtml.includes('000012345'), 'Raw routing number is NOT present in page view');
    assert.ok(!pageHtml.includes('000987654321'), 'Raw account number is NOT present in page view');
    console.log('✓ Raw bank values are never displayed on normal page');

    // Reload page to verify persistence of masked display
    console.log('15. Verifying bank info persists through reload...');
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('#view-routing-number');
    const reloadedMaskedRouting = await page.$eval('#view-routing-number', (el) => el.textContent?.trim());
    const reloadedMaskedAccount = await page.$eval('#view-account-number', (el) => el.textContent?.trim());
    assert.strictEqual(reloadedMaskedRouting, '•••••2345');
    assert.strictEqual(reloadedMaskedAccount, '••••••••4321');
    console.log('✓ Bank account changes persist across reload with masked display');

    console.log('\n=== ALL CUSTOMER PROFILE TESTS PASSED! ===');
  } finally {
    if (browser) await browser.close();
    if (viteProc) {
      spawn('taskkill', ['/pid', String(viteProc.pid), '/f', '/t']);
    }
  }
}

runCustomerProfileTests().catch((err) => {
  console.error('Customer Profile tests failed:', err);
  process.exit(1);
});
