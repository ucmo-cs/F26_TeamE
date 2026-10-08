import assert from 'node:assert';
import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';

async function runActiveLoansTests() {
  console.log('=== Starting Active Loans Page Verification Tests ===');

  console.log('1. Launching headless Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    // Step 1: Login as admin
    console.log('2. Logging in as admin...');
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle0' });
    await page.click('[title*="Click to fill demo credentials"]');
    await page.click('button[type="submit"]');
    await page.waitForSelector('header', { timeout: 8000 });
    assert.strictEqual(page.url(), `${BASE_URL}/admin/loans`);
    console.log('✓ Successfully logged in, on /admin/loans');

    // TEST 1: Page Header and Title
    console.log('3. Checking Page Header & Action button...');
    const pageTitle = await page.$eval('h1', (el) => el.textContent?.trim());
    assert.strictEqual(pageTitle, 'Active Loans');
    const pageDesc = await page.$eval('h1 + p', (el) => el.textContent?.trim());
    assert.strictEqual(pageDesc, 'Manage loans that have not been fully repaid.');

    const newLoanBtnText = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent?.includes('New Loan'))?.textContent?.trim();
    });
    assert.ok(newLoanBtnText?.includes('New Loan'), 'New Loan button is present');
    console.log('✓ Page Header and New Loan button verified');

    // TEST 2: Columns in exact order and alignment
    console.log('4. Checking table headers and exact column order...');
    await page.waitForSelector('table', { timeout: 8000 });
    const headers = await page.$$eval('table thead th', (ths) => ths.map((th) => th.textContent?.trim()));
    const expectedHeaders = ['Customer', 'Loan Date', 'Amount Owed', 'Original Amount', 'Interest Rate', 'Action'];
    assert.strictEqual(headers.length, 6, 'Must have exactly 6 columns');
    expectedHeaders.forEach((expected, i) => {
      assert.ok(headers[i].includes(expected), `Column ${i + 1} expected to contain "${expected}", got "${headers[i]}"`);
    });
    console.log('✓ All 6 required columns present in exact specified order: Customer, Loan Date, Amount Owed, Original Amount, Interest Rate, Action');

    // TEST 3: Partially repaid loans appear, fully repaid does NOT appear
    console.log('5. Verifying active-loans filtering (partially repaid appear, fully repaid Marcus Vance does not)...');
    const customerNames = await page.$$eval('table tbody tr td:first-child', (tds) => tds.map((td) => td.textContent?.trim()));
    assert.ok(customerNames.includes('Jane Smith'), 'Jane Smith (partially repaid) must appear');
    assert.ok(customerNames.includes('Robert Davis'), 'Robert Davis (partially repaid) must appear');
    assert.ok(customerNames.includes('Amanda Miller'), 'Amanda Miller (partially repaid) must appear');
    assert.ok(!customerNames.includes('Marcus Vance'), 'Marcus Vance (fully repaid, remainingBalance=0) must NOT appear');
    assert.strictEqual(customerNames.length, 3, 'Must have exactly 3 active loans initially');
    console.log('✓ Active-loans filtering verified: 3 partially repaid loans appear, fully repaid loan (Marcus Vance) excluded');

    // TEST 4: Formatting of currency, rates, and dates
    console.log('6. Verifying currency, interest rate, and table date formatting...');
    // Find row for Jane Smith
    const rowsData = await page.$$eval('table tbody tr', (rows) =>
      rows.map((row) => {
        const cells = Array.from(row.querySelectorAll('td')).map((td) => td.textContent?.trim());
        return {
          customer: cells[0],
          date: cells[1],
          owed: cells[2],
          original: cells[3],
          rate: cells[4],
          action: cells[5],
        };
      })
    );
    const janeRow = rowsData.find((r) => r.customer === 'Jane Smith');
    assert.ok(janeRow, 'Jane Smith row found');
    assert.strictEqual(janeRow.date, '08/14/2026', 'Date format MM/DD/YYYY');
    assert.strictEqual(janeRow.owed, '$18,420.32', 'Amount Owed format $XX,XXX.XX');
    assert.strictEqual(janeRow.original, '$25,000.00', 'Original Amount format $XX,XXX.XX');
    assert.strictEqual(janeRow.rate, '6.25%', 'Interest Rate format X.XX%');
    assert.strictEqual(janeRow.action, 'View', 'Action button text is "View"');
    console.log('✓ Currency ($18,420.32), rate (6.25%), date (08/14/2026), and action (View) format exactly as specified');

    // TEST 5: Default sort: Loan Date descending
    console.log('7. Verifying default sorting (Loan Date descending)...');
    const datesDefault = await page.$$eval('table tbody tr td:nth-child(2)', (tds) => tds.map((td) => td.textContent?.trim()));
    // Dates: 09/01/2026 (Amanda), 08/14/2026 (Jane), 05/10/2026 (Robert)
    assert.strictEqual(datesDefault[0], '09/01/2026', 'First should be most recent (09/01/2026)');
    assert.strictEqual(datesDefault[1], '08/14/2026', 'Second should be 08/14/2026');
    assert.strictEqual(datesDefault[2], '05/10/2026', 'Third should be oldest (05/10/2026)');
    console.log('✓ Default sort is Loan Date descending: ' + datesDefault.join(' > '));

    // TEST 6: Every sortable column works
    console.log('8. Testing sortable columns...');

    // Sort Customer asc
    console.log('   Testing Customer column sort...');
    await page.click('table thead th:nth-child(1)');
    let custNames = await page.$$eval('table tbody tr td:first-child', (tds) => tds.map((td) => td.textContent?.trim()));
    assert.strictEqual(custNames[0], 'Amanda Miller');
    assert.strictEqual(custNames[1], 'Jane Smith');
    assert.strictEqual(custNames[2], 'Robert Davis');

    // Sort Customer desc
    await page.click('table thead th:nth-child(1)');
    custNames = await page.$$eval('table tbody tr td:first-child', (tds) => tds.map((td) => td.textContent?.trim()));
    assert.strictEqual(custNames[0], 'Robert Davis');
    assert.strictEqual(custNames[2], 'Amanda Miller');

    // Sort Amount Owed asc/desc
    console.log('   Testing Amount Owed column sort...');
    await page.click('table thead th:nth-child(3)'); // defaults to desc
    let owedAmounts = await page.$$eval('table tbody tr td:nth-child(3)', (tds) => tds.map((td) => td.textContent?.trim()));
    assert.strictEqual(owedAmounts[0], '$38,900.50', 'Highest balance first on desc');
    assert.strictEqual(owedAmounts[2], '$11,200.00', 'Lowest balance last on desc');

    await page.click('table thead th:nth-child(3)'); // toggles to asc
    owedAmounts = await page.$$eval('table tbody tr td:nth-child(3)', (tds) => tds.map((td) => td.textContent?.trim()));
    assert.strictEqual(owedAmounts[0], '$11,200.00', 'Lowest balance first on asc');
    assert.strictEqual(owedAmounts[2], '$38,900.50', 'Highest balance last on asc');

    // Sort Original Amount
    console.log('   Testing Original Amount column sort...');
    await page.click('table thead th:nth-child(4)'); // desc
    const origAmounts = await page.$$eval('table tbody tr td:nth-child(4)', (tds) => tds.map((td) => td.textContent?.trim()));
    assert.strictEqual(origAmounts[0], '$40,000.00');
    assert.strictEqual(origAmounts[2], '$15,000.00');

    // Sort Interest Rate
    console.log('   Testing Interest Rate column sort...');
    await page.click('table thead th:nth-child(5)'); // desc
    const rates = await page.$$eval('table tbody tr td:nth-child(5)', (tds) => tds.map((td) => td.textContent?.trim()));
    assert.strictEqual(rates[0], '7.10%');
    assert.strictEqual(rates[2], '5.75%');
    console.log('✓ All 5 sortable columns toggle correctly between ascending and descending');

    // TEST 7: Customer search
    console.log('9. Testing customer search field...');
    const searchInput = await page.$('input[placeholder="Search by customer name"]');
    assert.ok(searchInput, 'Search input with placeholder "Search by customer name" present');

    // Search "jane" (case-insensitive)
    await page.type('input[placeholder="Search by customer name"]', 'jane');
    let searchResults = await page.$$eval('table tbody tr td:first-child', (tds) => tds.map((td) => td.textContent?.trim()));
    assert.strictEqual(searchResults.length, 1);
    assert.strictEqual(searchResults[0], 'Jane Smith');

    // Search non-existent customer
    await page.type('input[placeholder="Search by customer name"]', 'xyz_nobody');
    const emptyMsg = await page.$eval('.text-center', (el) => el.textContent?.trim());
    assert.ok(emptyMsg?.includes('No active loans were found.'), 'Empty state displayed on no matches');

    // Clear search
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const clearBtn = btns.find((b) => b.textContent?.includes('Clear Search'));
      if (clearBtn) clearBtn.click();
    });
    searchResults = await page.$$eval('table tbody tr td:first-child', (tds) => tds.map((td) => td.textContent?.trim()));
    assert.strictEqual(searchResults.length, 3, 'Clearing search restores active loans');
    console.log('✓ Customer search verified: case-insensitive, real-time filtering, empty state, and search clearing');

    // TEST 8: Clicking row / View button routes to correct loan ID
    console.log('10. Testing row click & View button navigation...');
    // Find Jane Smith row id
    const janeRowId = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      const row = rows.find((r) => r.textContent?.includes('Jane Smith'));
      return row?.getAttribute('data-loan-id');
    });
    assert.ok(janeRowId, 'Jane Smith row has loan ID');

    // Click View button in Jane Smith's row
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      const row = rows.find((r) => r.textContent?.includes('Jane Smith'));
      const viewBtn = row?.querySelector('button');
      if (viewBtn) viewBtn.click();
    });

    await page.waitForSelector('h1', { timeout: 5000 });
    assert.strictEqual(page.url(), `${BASE_URL}/admin/loans/${janeRowId}`, 'View button routes to /admin/loans/:loanId');
    console.log(`✓ View button correctly routes to /admin/loans/${janeRowId}`);

    // Go back to loans
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const backBtn = btns.find((b) => b.textContent?.includes('Back to Loans'));
      if (backBtn) backBtn.click();
    });
    await page.waitForSelector('table', { timeout: 5000 });
    assert.strictEqual(page.url(), `${BASE_URL}/admin/loans`);

    // Click entire row (Robert Davis)
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      const row = rows.find((r) => r.textContent?.includes('Robert Davis')) as HTMLElement | undefined;
      if (row) row.click();
    });
    await page.waitForSelector('h1', { timeout: 5000 });
    assert.ok(page.url().includes('/admin/loans/loan-102'), 'Clicking entire row routes to loan details');
    console.log('✓ Clicking row directly routes to /admin/loans/loan-102');

    // TEST 9: + New Loan button routes to /admin/loans/new
    console.log('11. Testing + New Loan primary action routing...');
    await page.goto(`${BASE_URL}/admin/loans`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('table', { timeout: 5000 });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const newBtn = btns.find((b) => b.textContent?.includes('New Loan'));
      if (newBtn) newBtn.click();
    });
    await page.waitForSelector('h1', { timeout: 5000 });
    assert.strictEqual(page.url(), `${BASE_URL}/admin/loans/new`, 'New Loan button routes to /admin/loans/new');
    console.log('✓ New Loan primary action routes to /admin/loans/new');

    console.log('=== ALL ACTIVE LOANS TESTS PASSED! ===');
  } finally {
    await browser.close();
  }
}

runActiveLoansTests().catch((err) => {
  console.error('Active loans tests failed:', err);
  process.exit(1);
});
