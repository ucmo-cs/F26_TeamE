import assert from 'node:assert';
import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';

async function runAdminLoanDetailsTests() {
  console.log('=== Starting Admin Loan Details Verification Tests ===');

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
    console.log('✓ Successfully logged in');

    // TEST 1: Correct loan loads from the URL
    console.log('3. Testing that correct loan loads from the URL (/admin/loans/loan-101)...');
    await page.goto(`${BASE_URL}/admin/loans/loan-101`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('h1', { timeout: 8000 });
    const pageTitle = await page.$eval('h1', (el) => el.textContent?.trim());
    assert.strictEqual(pageTitle, 'Jane Smith', 'Page title should be customer name');
    console.log('✓ Correct loan loaded from URL: Jane Smith');

    // TEST 2: All information matches the selected table row
    console.log('4. Checking that all 4 sections and loan values match table row data...');
    const bodyText = await page.$eval('main', (el) => el.textContent || '');
    assert.ok(bodyText.includes('$18,420.32'), 'Remaining balance must match $18,420.32');
    assert.ok(bodyText.includes('$25,000.00'), 'Original amount must match $25,000.00');
    assert.ok(bodyText.includes('6.25%'), 'Interest rate must match 6.25%');
    assert.ok(bodyText.includes('08/14/2026'), 'Loan date must match 08/14/2026');
    assert.ok(bodyText.includes('jane@example.com'), 'Email matches');
    assert.ok(bodyText.includes('(555) 555-1234'), 'Phone matches');

    // Verify all four section headers
    assert.ok(bodyText.includes('Loan Summary'), 'Section A present');
    assert.ok(bodyText.includes('Customer Information'), 'Section B present');
    assert.ok(bodyText.includes('Automatic Payment Account'), 'Section C present');
    assert.ok(bodyText.includes('Automatic Payment Schedule'), 'Section D present');
    console.log('✓ All 4 sections present and all loan data matches table row');

    // TEST 3: Bank numbers are masked in view mode
    console.log('5. Verifying bank numbers are properly masked in view mode...');
    assert.ok(bodyText.includes('•••••2345'), 'Routing number is masked with bullet prefix');
    assert.ok(bodyText.includes('••••••••4321'), 'Account number is masked with bullet prefix');
    assert.ok(!bodyText.includes('000012345'), 'Raw routing number must NOT be visible');
    assert.ok(!bodyText.includes('000987654321'), 'Raw account number must NOT be visible');
    console.log('✓ Bank routing and account numbers are properly masked (•••••2345, ••••••••4321)');

    // TEST 4: Remaining balance cannot be edited in edit mode
    console.log('6. Testing that Remaining Balance is strictly read-only in edit mode...');
    await page.click('button:has-text("Edit")').catch(async () => {
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        btns.find((b) => b.textContent?.trim() === 'Edit')?.click();
      });
    });

    await page.waitForSelector('input#edit-original-amount', { timeout: 5000 });
    // Verify no input exists for remaining balance
    const remBalInput = await page.$('input#edit-remaining-balance');
    assert.strictEqual(remBalInput, null, 'Remaining balance must not have an editable input');
    const readOnlyBadge = await page.evaluate(() => {
      const badges = Array.from(document.querySelectorAll('span'));
      return badges.some((b) => b.textContent?.trim() === 'Read-only');
    });
    assert.ok(readOnlyBadge, 'Read-only indicator shown for remaining balance');
    console.log('✓ Remaining Balance cannot be edited (strictly read-only)');

    // TEST 5: Calculation updates when relevant fields change
    console.log('7. Testing calculation updates when interest rate or payment amount changes...');
    // Initial monthly minimum at 6.25% should be around $486.21
    const initialMin = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('span.tabular-nums'));
      return els.map((e) => e.textContent?.trim());
    });
    console.log('   Initial monthly minimum display:', initialMin[1]);

    // Change interest rate to 12.00%
    await page.click('#edit-interest-rate', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('#edit-interest-rate', '12.00');

    // Check recalculated minimum monthly payment
    const updatedMin = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('span.tabular-nums'));
      return els.map((e) => e.textContent?.trim());
    });
    console.log('   Recalculated monthly minimum display at 12%:', updatedMin[1]);
    assert.notStrictEqual(initialMin[1], updatedMin[1], 'Minimum monthly payment must dynamically update with rate change');
    console.log('✓ Calculation updates dynamically in real-time when interest rate changes');

    // TEST 6: Cancel discards changes
    console.log('8. Testing that Cancel discards uncommitted changes...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      btns.find((b) => b.textContent?.trim() === 'Cancel')?.click();
    });

    await page.waitForSelector('button:has-text("Edit")', { timeout: 5000 }).catch(async () => {
      await page.waitForFunction(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.some((b) => b.textContent?.trim() === 'Edit');
      });
    });

    const discardedText = await page.$eval('main', (el) => el.textContent || '');
    assert.ok(discardedText.includes('6.25%'), 'Interest rate must remain original 6.25%');
    assert.ok(!discardedText.includes('12.00%'), 'Unsaved 12.00% must be discarded');
    console.log('✓ Cancel discards changes and restores view mode');

    // TEST 7: Customer, Loan, and Payment schedule editing + Save surviving refresh
    console.log('9. Testing full editing of customer, loan, and payment schedule, and save persistence...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      btns.find((b) => b.textContent?.trim() === 'Edit')?.click();
    });
    await page.waitForSelector('#edit-original-amount', { timeout: 5000 });

    async function clearAndType(selector: string, text: string) {
      await page.click(selector);
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      await page.type(selector, text);
    }

    // Edit customer name, email, phone
    await clearAndType('#edit-customer-name', 'Jane S. Updated');
    await clearAndType('#edit-customer-email', 'jane.updated@example.com');
    await clearAndType('#edit-customer-phone', '(555) 888-9999');

    // Edit original amount and interest rate
    await clearAndType('#edit-original-amount', '28000');
    await clearAndType('#edit-interest-rate', '6.50');

    // Edit payment schedule
    await page.select('#edit-frequency', 'MONTHLY');
    await clearAndType('#edit-payment-amount', '550.00');

    // Save changes
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      btns.find((b) => b.textContent?.trim() === 'Save Changes')?.click();
    });

    // Verify success alert
    await page.waitForSelector('[role="alert"]', { timeout: 6000 });
    const successMsg = await page.$eval('[role="alert"]', (el) => el.textContent?.trim());
    assert.ok(successMsg?.includes('Changes saved successfully.'), 'Success notification shown');

    // Verify updated values in view mode
    const updatedViewText = await page.$eval('main', (el) => el.textContent || '');
    assert.ok(updatedViewText.includes('Jane S. Updated'), 'Customer name updated');
    assert.ok(updatedViewText.includes('jane.updated@example.com'), 'Email updated');
    assert.ok(updatedViewText.includes('(555) 888-9999'), 'Phone updated');
    assert.ok(updatedViewText.includes('$28,000.00'), 'Original amount updated');
    assert.ok(updatedViewText.includes('6.50%'), 'Interest rate updated');
    assert.ok(updatedViewText.includes('$550.00'), 'Payment amount updated');
    assert.ok(updatedViewText.includes('Monthly'), 'Frequency updated to Monthly');
    console.log('✓ Changes saved successfully and reflected in view mode');

    // TEST 8: Save survives a page reload
    console.log('10. Testing that saved changes survive a page refresh...');
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('h1', { timeout: 6000 });

    const reloadedText = await page.$eval('main', (el) => el.textContent || '');
    assert.ok(reloadedText.includes('Jane S. Updated'), 'Persisted customer name after reload');
    assert.ok(reloadedText.includes('jane.updated@example.com'), 'Persisted email after reload');
    assert.ok(reloadedText.includes('$28,000.00'), 'Persisted original amount after reload');
    assert.ok(reloadedText.includes('6.50%'), 'Persisted interest rate after reload');
    assert.ok(reloadedText.includes('$550.00'), 'Persisted payment amount after reload');
    console.log('✓ All changes survive page refresh');

    // TEST 9: Loading second loan (/admin/loans/loan-102)
    console.log('11. Testing second loan (/admin/loans/loan-102 without schedule)...');
    await page.goto(`${BASE_URL}/admin/loans/loan-102`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('h1', { timeout: 6000 });
    const loan2Title = await page.$eval('h1', (el) => el.textContent?.trim());
    assert.strictEqual(loan2Title, 'Robert Davis');
    const loan2Text = await page.$eval('main', (el) => el.textContent || '');
    assert.ok(loan2Text.includes('No bank account has been configured.'));
    assert.ok(loan2Text.includes('No automatic payment schedule has been configured.'));
    console.log('✓ Loan without bank account / schedule displays empty messages accurately');

    console.log('=== ALL ADMIN LOAN DETAILS TESTS PASSED! ===');
    process.exit(0);
  } finally {
    await browser.close();
  }
}

runAdminLoanDetailsTests().catch((err) => {
  console.error('Admin loan details tests failed:', err);
  process.exit(1);
});
