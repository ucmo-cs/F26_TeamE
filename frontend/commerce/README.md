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
