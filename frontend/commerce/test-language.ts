import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import { getLanguage, setLanguage, subscribe, translate } from './src/i18n/language.ts';
import { formatCurrency, formatProminentDate, formatTableDate } from './src/utils/formatting.ts';
import { formatFrequencyLabel, formatMonthDay, formatScheduleDay } from './src/utils/paymentSchedule.ts';
import { DEMO_ADMIN_CREDENTIALS } from './src/data/mockData.ts';

// Unit coverage for locale-sensitive values and messages held in form state.
setLanguage('en');
const dollars = formatCurrency(1234.56);
assert.equal(formatTableDate('2026-10-08'), '10/08/2026');
assert.equal(formatMonthDay(21), '21st of each month');
let notifications = 0;
const unsubscribe = subscribe(() => notifications++);
setLanguage('es');
assert.equal(getLanguage(), 'es');
assert.equal(notifications, 1);
unsubscribe();
assert.equal(translate('Set Up Payments'), 'Configurar pagos');
assert.equal(translate('Payment must be at least $250.00.'), 'El pago debe ser de al menos $250.00.');
assert.equal(translate('{count} payments per year', { count: 26 }), '26 pagos al año');
assert.equal(formatTableDate('2026-10-08'), '08/10/2026');
assert.match(formatProminentDate('2026-10-08'), /octubre/);
assert.equal(formatCurrency(1234.56), dollars, 'Changing language must preserve USD amounts');
assert.equal(formatMonthDay(21), 'El 21 de cada mes');
assert.equal(formatFrequencyLabel('BIWEEKLY'), 'Cada dos semanas');
assert.equal(formatScheduleDay({ frequency: 'BIWEEKLY', dayOfWeek: 'WEDNESDAY', paymentAmount: 100 }), 'Cada dos semanas, el miércoles');
assert.equal(translate('Customer with ID "123" not found.'), 'No se encontró el cliente con el identificador «123».');
setLanguage('en');
assert.equal(translate('Payment must be at least $250.00.'), 'Payment must be at least $250.00.');

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
});
const page = await browser.newPage();
const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:5173';
const pageErrors: string[] = [];
page.on('pageerror', (error) => pageErrors.push(String(error)));
await page.setViewport({ width: 1440, height: 1000 });

async function expectText(text: string) {
  try {
    await page.waitForFunction((expected) => document.body.innerText.includes(expected), { timeout: 10000 }, text);
  } catch (error) {
    console.error('Expected text:', text, 'URL:', page.url(), 'Page errors:', pageErrors);
    console.error(await page.evaluate(() => document.body.innerText));
    throw error;
  }
}
async function switchLanguage(language: string) {
  await page.select('select[aria-label="Language"], select[aria-label="Idioma"]', language);
  await page.waitForFunction((expected) => document.documentElement.lang === expected, {}, language);
}
async function clickText(text: string) {
  await page.waitForFunction((label) => Array.from(document.querySelectorAll('button'))
    .some((item) => item.textContent?.trim() === label && !(item as HTMLButtonElement).disabled), {}, text);
  const clicked = await page.evaluate((label) => {
    const button = Array.from(document.querySelectorAll('button')).find((item) => item.textContent?.trim() === label);
    button?.click();
    return !!button;
  }, text);
  assert.ok(clicked, `Button not found: ${text}`);
}

try {
  await page.goto(`${baseUrl}/customer/login`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await page.type('#customer-email', 'jane@example.com');
  await switchLanguage('es');
  assert.equal(await page.$eval('#customer-email', (input) => (input as HTMLInputElement).value), 'jane@example.com');
  await expectText('Portal del cliente');
  assert.match(await page.title(), /Seguimiento de préstamos/);
  await page.type('#customer-password', 'wrong-password');
  await clickText('Iniciar sesión');
  await expectText('Correo electrónico o contraseña incorrectos');
  await switchLanguage('en');
  await expectText('Invalid email or password');
  await switchLanguage('es');
  await page.focus('#customer-password');
  await page.keyboard.down('Control');
  await page.keyboard.press('A');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await page.type('#customer-password', 'customer123');
  assert.equal(await page.$eval('#customer-password', (input) => (input as HTMLInputElement).value), 'customer123');
  await clickText('Iniciar sesión');
  await expectText('Mi préstamo');
  await expectText('Resumen de pagos automáticos');
  await page.reload({ waitUntil: 'networkidle0' });
  await expectText('Mi préstamo');
  assert.equal(await page.evaluate(() => document.documentElement.lang), 'es');

  await page.goto(`${baseUrl}/customer/payments`, { waitUntil: 'networkidle0' });
  await expectText('Programación actual');
  await expectText('12 pagos al año');
  await page.click('#freq-monthly input');
  await expectText('El 15 de cada mes');
  const originalAmount = await page.$eval('#payment-amount', (input) => (input as HTMLInputElement).value);
  await switchLanguage('en');
  await expectText('Current Schedule');
  assert.equal(await page.$eval('#payment-amount', (input) => (input as HTMLInputElement).value), originalAmount);
  await switchLanguage('es');
  await page.click('#freq-biweekly input');
  await expectText('Cada dos semanas, el viernes');
  await clickText('Guardar programación');
  await expectText('La programación de pagos se guardó correctamente.');
  await switchLanguage('en');
  await expectText('Payment schedule saved.');
  await page.goto(`${baseUrl}/customer/profile`, { waitUntil: 'networkidle0' });
  await switchLanguage('es');
  await expectText('Información personal');
  await expectText('Cuenta corriente');

  await clickText('Cerrar sesión');
  await expectText('Portal del cliente');
  await page.goto(`${baseUrl}/admin/login`, { waitUntil: 'networkidle0' });
  await expectText('Portal del administrador');
  await page.type('#admin-username', DEMO_ADMIN_CREDENTIALS.username);
  await page.type('#admin-password', DEMO_ADMIN_CREDENTIALS.password);
  await clickText('Iniciar sesión');
  await expectText('Préstamos activos');
  await clickText('Ver');
  await expectText('Resumen del préstamo');
  await clickText('Editar');
  await expectText('Guardar cambios');
  await switchLanguage('en');
  await expectText('Save Changes');
  await clickText('Cancel');
  await page.goto(`${baseUrl}/admin/loans/new`, { waitUntil: 'networkidle0' });
  await switchLanguage('es');
  await clickText('Crear préstamo');
  await expectText('El nombre del cliente es obligatorio.');
  await switchLanguage('en');
  await expectText('Customer name is required.');

  await switchLanguage('es');
  await clickText('Cerrar sesión');
  await page.waitForSelector('#admin-username');
  await page.goto(`${baseUrl}/customer/login`, { waitUntil: 'networkidle0' });
  await page.type('#customer-email', 'robert@example.com');
  await page.type('#customer-password', 'customer123');
  await clickText('Iniciar sesión');
  await expectText('No hay pagos automáticos programados');
  assert.equal(await page.evaluate(() => {
    const heading = Array.from(document.querySelectorAll('h3')).find((item) => item.textContent === 'Resumen de pagos automáticos');
    const card = heading?.parentElement?.parentElement?.parentElement;
    return Array.from(card?.querySelectorAll('button') || []).filter((item) => item.textContent?.trim() === 'Configurar pagos').length;
  }), 1, 'The empty payment summary must have one setup action');
  await page.setViewport({ width: 1024, height: 1000 });
  if (process.env.TEST_SCREENSHOT) await page.screenshot({ path: process.env.TEST_SCREENSHOT, fullPage: true });
  await page.goto(`${baseUrl}/customer/payments`, { waitUntil: 'networkidle0' });
  await expectText('Agregue una cuenta bancaria antes de programar pagos automáticos.');
  assert.equal(await page.$eval('button[type="submit"]', (button) => (button as HTMLButtonElement).disabled), true);
  assert.deepEqual(pageErrors, []);
  console.log('Language tests passed: locale formatting, login, persistence, customer/admin pages, payment save, validation, and form preservation.');
} finally {
  await browser.close();
}
