import assert from 'node:assert';
import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';

async function runCreateLoanTests() {
  console.log('=== Starting Create New Loan Verification Tests ===');

  console.log('1. Launching headless Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  async function clearAndType(selector: string, text: string) {
    await page.click(selector);
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await page.type(selector, text);
  }

  try {
    // Step 1: Login as admin
    console.log('2. Logging in as admin...');
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle0' });
    await page.click('[title*="Click to fill demo credentials"]');
    await page.click('button[type="submit"]');
    await page.waitForSelector('header', { timeout: 8000 });
    assert.strictEqual(page.url(), `${BASE_URL}/admin/loans`);
    console.log('✓ Successfully logged in');

    // Step 2: Navigate to /admin/loans/new
    console.log('3. Navigating to /admin/loans/new...');
    await page.goto(`${BASE_URL}/admin/loans/new`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('h1', { timeout: 5000 });
    const pageTitle = await page.$eval('h1', (el) => el.textContent?.trim());
    assert.strictEqual(pageTitle, 'Create New Loan');
    console.log('✓ On /admin/loans/new page');

    // TEST 1: Blank form cannot submit & shows inline errors
    console.log('4. Testing that blank form cannot submit and shows required inline errors...');
    // Ensure all text inputs are empty
    await clearAndType('#new-customer-name', '');
    await clearAndType('#new-customer-email', '');
    await clearAndType('#new-customer-phone', '');
    await clearAndType('#new-original-amount', '');
    await clearAndType('#new-interest-rate', '');

    await page.click('button[type="submit"]');

    // Verify errors appeared on fields
    const errorMessages = await page.$$eval('p.text-\\[\\#B42318\\]', (els) => els.map((e) => e.textContent?.trim()));
    assert.ok(errorMessages.some((msg) => msg?.includes('Customer name is required.')));
    assert.ok(errorMessages.some((msg) => msg?.includes('Email address is required.')));
    assert.ok(errorMessages.some((msg) => msg?.includes('Phone number is required.')));
    assert.ok(errorMessages.some((msg) => msg?.includes('Original loan amount is required.')));
    assert.ok(errorMessages.some((msg) => msg?.includes('Annual interest rate is required.')));
    assert.strictEqual(page.url(), `${BASE_URL}/admin/loans/new`, 'Should remain on /admin/loans/new');
    console.log('✓ Blank form cannot submit; required inline errors shown for all fields');

    // TEST 2: Invalid amount and rate show specific inline validation errors
    console.log('5. Testing invalid amount, rate, and email validation errors...');
    await clearAndType('#new-customer-name', 'Test Customer');
    await clearAndType('#new-customer-email', 'invalid-email-format');
    await clearAndType('#new-customer-phone', '555-1234');
    await clearAndType('#new-original-amount', '-1000');
    await clearAndType('#new-interest-rate', '120'); // > 100%

    await page.click('button[type="submit"]');

    const specificErrors = await page.$$eval('p.text-\\[\\#B42318\\]', (els) => els.map((e) => e.textContent?.trim()));
    assert.ok(specificErrors.some((msg) => msg?.includes('Please enter a valid email address.')));
    assert.ok(specificErrors.some((msg) => msg?.includes('Original amount must be greater than $0.00.')));
    assert.ok(specificErrors.some((msg) => msg?.includes('Interest rate must be between 0.00% and 100.00%.')));
    assert.strictEqual(page.url(), `${BASE_URL}/admin/loans/new`);
    console.log('✓ Invalid amount, rate, and email show specific inline errors');

    // TEST 3: Valid loan creates & redirects to new Loan Details page
    console.log('6. Submitting valid new loan...');
    await clearAndType('#new-customer-name', 'Sarah Connor');
    await clearAndType('#new-customer-email', 'sarah.connor@example.com');
    await clearAndType('#new-customer-phone', '(555) 234-5678');
    await clearAndType('#new-loan-date', '2026-10-01');
    await clearAndType('#new-original-amount', '35000');
    await clearAndType('#new-interest-rate', '5.25');

    await page.click('button[type="submit"]');

    // Wait for redirect to /admin/loans/loan-...
    await page.waitForFunction(() => window.location.pathname.startsWith('/admin/loans/loan-'), { timeout: 8000 });
    const currentUrl = page.url();
    assert.ok(currentUrl.includes('/admin/loans/loan-'), 'Redirected to new loan details page');
    console.log(`✓ Valid loan creates and redirects to new Loan Details page: ${currentUrl}`);

    // TEST 4: New loan's detail page is correct + shows creation confirmation banner
    console.log('7. Verifying detail page values and creation confirmation banner...');
    await page.waitForSelector('h1', { timeout: 5000 });
    const detailTitle = await page.$eval('h1', (el) => el.textContent?.trim());
    assert.strictEqual(detailTitle, 'Sarah Connor', 'Page title should be new customer name');

    // Verify confirmation alert
    const alertText = await page.$eval('[role="alert"]', (el) => el.textContent || '');
    assert.ok(alertText.includes('Loan created successfully.'), 'Confirmation header shown');
    assert.ok(alertText.includes('sarah.connor@example.com'), 'Displays customer email');
    assert.ok(alertText.includes('customer123'), 'Displays password customer123');
    assert.ok(alertText.includes('No email was sent because this is a frontend prototype.'), 'States prototype notice');

    // Verify loan values
    const detailContent = await page.$eval('main', (el) => el.textContent || '');
    assert.ok(detailContent.includes('$35,000.00'), 'Original Amount and Remaining Balance are $35,000.00');
    assert.ok(detailContent.includes('5.25%'), 'Interest rate is 5.25%');
    assert.ok(detailContent.includes('(555) 234-5678'), 'Phone number matches');
    console.log('✓ New loan detail page displays correct data and creation confirmation banner');

    // TEST 5: New loan appears in Active Loans
    console.log('8. Verifying new loan appears in Active Loans table...');
    await page.goto(`${BASE_URL}/admin/loans`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('table', { timeout: 6000 });

    let activeCustomerNames = await page.$$eval('table tbody tr td:first-child', (tds) => tds.map((td) => td.textContent?.trim()));
    assert.ok(activeCustomerNames.includes('Sarah Connor'), 'Sarah Connor must appear in active loans');
    console.log('✓ Newly created loan appears in Active Loans list');

    // TEST 6: Refresh does not erase it
    console.log('9. Testing that refresh does not erase newly created loan...');
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('table', { timeout: 6000 });

    activeCustomerNames = await page.$$eval('table tbody tr td:first-child', (tds) => tds.map((td) => td.textContent?.trim()));
    assert.ok(activeCustomerNames.includes('Sarah Connor'), 'Sarah Connor persists after page reload');
    console.log('✓ Newly created loan survives page refresh in localStorage');

    // TEST 7: Generated customer credentials work for logging in to Customer Portal
    console.log('10. Testing that generated credentials (sarah.connor@example.com / customer123) work...');
    // Log out admin
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('header button'));
      const logoutBtn = btns.find((b) => b.textContent?.includes('Log Out'));
      if (logoutBtn) logoutBtn.click();
    });
    await page.waitForSelector('#admin-username', { timeout: 6000 });

    // Navigate to /customer/login
    await page.goto(`${BASE_URL}/customer/login`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#customer-email', { timeout: 5000 });

    await clearAndType('#customer-email', 'sarah.connor@example.com');
    await clearAndType('#customer-password', 'customer123');
    await page.click('button[type="submit"]');

    // Wait for customer home page /customer/loan
    await page.waitForFunction(() => window.location.pathname === '/customer/loan', { timeout: 8000 });
    assert.strictEqual(page.url(), `${BASE_URL}/customer/loan`, 'Customer logged into /customer/loan');

    await page.waitForSelector('h1', { timeout: 5000 });
    const custPageTitle = await page.$eval('h1', (el) => el.textContent?.trim());
    assert.strictEqual(custPageTitle, 'My Loan');

    // Wait for loan details to load from mockCustomerApi
    await page.waitForSelector('.tabular-nums', { timeout: 6000 });

    // Verify balance and original amount match newly created loan
    const custPageContent = await page.$eval('main', (el) => el.textContent || '');
    assert.ok(custPageContent.includes('$35,000.00'), 'Customer loan balance is $35,000.00');
    assert.ok(custPageContent.includes('5.25%'), 'Customer interest rate is 5.25%');
    console.log('✓ Generated customer credentials successfully logged into Customer Portal and load new loan!');

    console.log('=== ALL CREATE NEW LOAN TESTS PASSED! ===');
  } finally {
    await browser.close();
  }
}

runCreateLoanTests().catch((err) => {
  console.error('Create loan tests failed:', err);
  process.exit(1);
});
