# FivePoint Bank frontend

React, TypeScript, React Router, and Tailwind CSS prototype for loan repayment tracking.
Administrators can create and edit loans; customers can view their loan, update their profile
and bank account, and configure automatic payments.

## Development

Run these commands from `frontend/commerce`:

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. Demo credentials are available on each login page.

## Languages

Use the **Language / Idioma** selector on either login page or in the signed-in header
to switch between English and Spanish. The browser remembers the choice. New visitors
with a Spanish browser language start in Spanish; other visitors start in English.
Switching languages preserves form edits, login sessions, and loan data. Dates and
payment schedule labels follow the selected language; monetary amounts remain in USD.

Spanish translations live in `src/i18n/es.json`. Components use `useLanguage()` and
`t('English message', { parameter: value })`. Keep messages stored in form state in
English; shared alerts and validation fields translate them when displayed.

Run `npm run test:language` with the website running at `http://localhost:5173`.
Override `TEST_BASE_URL` or `CHROME_PATH` for another server or Chrome installation.

## Checks

```sh
npm run lint
npm run build
npm run test:unit
npm run test:e2e
```

Browser tests use Puppeteer with Chrome at `C:\Program Files\Google\Chrome\Application\chrome.exe`.
The additional `test:*` scripts in `package.json` cover individual admin and customer flows.

## Structure

- `src/pages`: admin and customer screens.
- `src/components`: shared controls and application layout.
- `src/router` and `src/context`: routes, access guards, and authentication state.
- `src/api`: asynchronous mock services; no backend connection.
- `src/utils`: formatting, payment calculations, and prototype storage.
- `src/data`: demo seed data.

Data and demo sessions persist in browser local storage. Use **Reset Demo Data** in the
development sidebar to restore defaults. This is a prototype: credentials and bank details
are simulated and must not be used with real customer data.

Screen requirements are documented in `loan-repayment-frontend-content-spec.md` and
`loan-repayment-frontend-rules-style.md`.
