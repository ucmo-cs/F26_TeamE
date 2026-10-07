# Loan Repayment Tracker — Frontend Content & Behavior Specification

## 1. Purpose

This document defines **what the frontend prototype must contain and how it must behave**.

This is a **frontend-only prototype**. There is no backend, no Spring server integration, no database connection, and no real authentication or email delivery in this version.

The prototype must still be structured so that mock data/services can later be replaced with real API calls without redesigning the pages.

Visual styling and implementation conventions are defined separately in:

`loan-repayment-frontend-rules-style.md`

---

# 2. Project Decisions

Use:

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS

Other decisions:

- Desktop-only prototype.
- No phone/mobile support is required.
- Authenticated pages use a left sidebar.
- Visual direction: traditional modern bank.
- Admins can edit existing loan/customer/repayment information.
- Customers have a separate Profile page.
- Prototype data is mocked in the frontend.
- Prototype authentication is mocked in the frontend.
- No real email is sent.
- No real payment is processed.
- No real financial account is contacted.

---

# 3. Prototype Scope

The application contains two separate experiences.

## Admin Portal

Pages:

1. Admin Login
2. Active Loans
3. Create New Loan
4. Loan Details / Edit Loan

## Customer Portal

Pages:

1. Customer Login
2. My Loan
3. Profile
4. Automatic Payments

---

# 4. Prototype Architecture Rule

The UI must not hard-code data directly inside page components.

Create a mock service layer that behaves like a future API.

Recommended structure:

```text
src/
  api/
    mockAuthApi.ts
    mockAdminLoansApi.ts
    mockCustomerApi.ts
    mockPaymentApi.ts

  data/
    mockData.ts
```

Pages must call these mock service functions instead of importing raw mock objects directly.

Example:

```ts
const loans = await mockAdminLoansApi.getActiveLoans();
```

Do not write:

```ts
import { loans } from "../data/mockData";
```

inside every page.

This separation is required so the mock API can later be replaced by real REST calls without changing the page behavior.

---

# 5. Mock Request Behavior

Mock service functions should return Promises.

Example:

```ts
async function getActiveLoans(): Promise<LoanSummary[]> {
  await fakeDelay();
  return ...
}
```

Recommended simulated delay:

```text
300–700 ms
```

This is required so loading states are visible and testable.

Do not add random failures by default.

Optional developer-only failure flags may exist for testing error states, but normal usage should be stable.

---

# 6. Prototype Persistence

Use `localStorage` for prototype persistence.

Persist:

- current mock session;
- customer profile edits;
- bank-account edits;
- payment-schedule edits;
- admin loan edits;
- newly created loans.

This allows the prototype to behave like a real application across page refreshes.

Provide a simple utility such as:

```ts
loadPrototypeState()
savePrototypeState()
resetPrototypeState()
```

The initial mock dataset should be used only when no saved prototype state exists.

Do not use IndexedDB or Redux for this prototype.

---

# 7. Prototype Authentication

Authentication is simulated.

There are two mock roles:

```ts
type UserRole = "ADMIN" | "CUSTOMER";
```

Provide predefined demo credentials.

Recommended defaults:

```text
Admin
Username: admin
Password: admin123

Customer
Email: jane@example.com
Password: customer123
```

These credentials are prototype-only and may be displayed beneath the login form in a muted "Demo credentials" box.

The prototype must make it obvious that these are demo credentials.

Do not implement:

- password reset;
- password hashing;
- MFA;
- session refresh tokens;
- registration;
- account recovery.

---

# 8. Route Structure

Use React Router.

## Public routes

```text
/admin/login
/customer/login
```

## Admin authenticated routes

```text
/admin/loans
/admin/loans/new
/admin/loans/:loanId
```

## Customer authenticated routes

```text
/customer/loan
/customer/profile
/customer/payments
```

## Default routes

```text
/             -> /customer/login

/admin        -> /admin/loans when logged in as admin
                 otherwise /admin/login

/customer     -> /customer/loan when logged in as customer
                 otherwise /customer/login
```

---

# 9. Prototype Route Protection

Use mock session state.

If not logged in:

```text
/admin/* -> /admin/login
/customer/* -> /customer/login
```

An admin session must not unlock customer routes.

A customer session must not unlock admin routes.

Logging out:

1. clears mock session state;
2. keeps the saved prototype data;
3. returns to the correct login page.

---

# 10. Core Data Types

Use explicit TypeScript types.

```ts
interface LoanSummary {
  id: string;
  customerName: string;
  loanDate: string;
  remainingBalance: number;
  originalAmount: number;
  annualInterestRate: number;
}

interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
}

type BankAccountType = "CHECKING" | "SAVINGS";

interface BankAccount {
  bankName: string;
  accountType: BankAccountType;
  routingNumber: string;
  accountNumber: string;
}

type PaymentFrequency = "MONTHLY" | "BIWEEKLY" | "WEEKLY";

type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

interface PaymentSchedule {
  frequency: PaymentFrequency;
  paymentAmount: number;
  dayOfMonth?: number;
  dayOfWeek?: DayOfWeek;
  nextPaymentDate?: string;
}

interface Loan {
  id: string;
  customer: CustomerProfile;
  loanDate: string;
  originalAmount: number;
  remainingBalance: number;
  annualInterestRate: number;
  bankAccount?: BankAccount;
  paymentSchedule?: PaymentSchedule;
}
```

---

# 11. Mock Calculation Rules

The prototype should calculate display values locally.

Create shared utility functions for:

- minimum monthly payment;
- frequency-adjusted minimum payment;
- estimated payoff date.

Do not place financial formulas directly inside page components.

Recommended utilities:

```text
src/utils/loanCalculations.ts
```

Functions:

```ts
calculateMonthlyMinimum(...)
calculateScheduledMinimum(...)
calculateEstimatedPayoffDate(...)
```

These calculations are prototype behavior only.

When the real backend is added later, the backend should become authoritative.

---

# 12. Standard Amortization Calculation

For the prototype, use the standard fixed-payment amortization formula:

```text
M = P × [ r(1+r)^n ] / [ (1+r)^n - 1 ]
```

Where:

```text
P = remaining principal
r = periodic interest rate
n = number of payments remaining
```

Because the assignment does not define a loan term field, the prototype must use a clearly defined default assumption.

Use:

```text
Default amortization term: 60 months
```

for prototype calculations unless a term field is later added.

Keep this constant in one place:

```ts
const DEFAULT_LOAN_TERM_MONTHS = 60;
```

Do not silently scatter this assumption across components.

---

# 13. Frequency Minimum Rules

For prototype display calculations:

## Monthly

```text
12 payments per year
```

## Bi-weekly

```text
26 payments per year
```

## Weekly

```text
52 payments per year
```

Convert annual interest rate to the corresponding periodic rate.

The payment amount cannot be less than the calculated minimum for the selected frequency.

---

# 14. Global Formatting

## Currency

Display:

```text
$12,345.67
```

Always:

- dollar sign;
- comma separators;
- exactly two decimals.

## Interest

Display:

```text
6.25%
```

Store prototype interest values as percentage numbers:

```ts
6.25
```

not:

```ts
0.0625
```

## Dates

Store ISO-style strings:

```text
YYYY-MM-DD
```

Display table dates as:

```text
MM/DD/YYYY
```

Display prominent dates as:

```text
October 7, 2026
```

---

# 15. Shared Authenticated Layout

All authenticated pages use:

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Header                                                              │
├──────────────────┬──────────────────────────────────────────────────┤
│ Left Sidebar     │ Main Content                                     │
│                  │                                                  │
│                  │                                                  │
└──────────────────┴──────────────────────────────────────────────────┘
```

## Header

Left:

```text
Loan Repayment Tracker
```

Right:

- current mock user name;
- role;
- Log Out.

## Admin Sidebar

Exactly:

```text
Loans
New Loan
```

Routes:

```text
Loans     -> /admin/loans
New Loan  -> /admin/loans/new
```

## Customer Sidebar

Exactly:

```text
My Loan
Profile
Payments
```

Routes:

```text
My Loan   -> /customer/loan
Profile   -> /customer/profile
Payments  -> /customer/payments
```

Current route must be visually active.

---

# 16. Shared Page States

Even though the prototype uses mock data, implement realistic states.

Every data page must support:

- loading;
- populated;
- empty where relevant;
- error;
- saving;
- saved/success.

Mock service delays must be long enough for loading states to appear.

---

# 17. ADMIN PORTAL

---

# Page A1 — Admin Login

## Route

```text
/admin/login
```

## Purpose

Simulate admin authentication.

## Layout

Centered login card.

Fields:

```text
Username
Password
```

Primary action:

```text
Log In
```

## Demo Credentials

Show beneath the form:

```text
Demo credentials

Username: admin
Password: admin123
```

## Validation

Both fields required.

## Valid Login

Credentials:

```text
admin
admin123
```

On success:

```text
/admin/loans
```

## Invalid Login

Display:

```text
Invalid username or password.
```

Remain on page.

---

# Page A2 — Active Loans

## Route

```text
/admin/loans
```

## Page Title

```text
Active Loans
```

## Description

```text
Manage loans that have not been fully repaid.
```

## Primary Action

```text
+ New Loan
```

Route:

```text
/admin/loans/new
```

## Required Table Columns

In this exact order:

1. Customer
2. Loan Date
3. Amount Owed
4. Original Amount
5. Interest Rate
6. Action

Example:

```text
Jane Smith | 08/14/2026 | $18,420.32 | $25,000.00 | 6.25% | View
```

Only show loans where:

```ts
remainingBalance > 0
```

## Row Behavior

Clicking either:

- row;
- `View`;

opens:

```text
/admin/loans/:loanId
```

## Search

Add:

```text
Search by customer name
```

Behavior:

- case-insensitive;
- filters current mock dataset;
- updates immediately.

## Sorting

Sortable:

- Customer
- Loan Date
- Amount Owed
- Original Amount
- Interest Rate

Default:

```text
Loan Date descending
```

## Empty State

```text
No active loans were found.
[ Create New Loan ]
```

---

# Page A3 — Create New Loan

## Route

```text
/admin/loans/new
```

## Page Title

```text
Create New Loan
```

## Description

```text
Create a new loan and generate a customer prototype account.
```

Because this is frontend-only, no email is actually sent.

---

## Section A — Customer Information

Fields:

```text
Customer Name
Email Address
Phone Number
```

All required.

---

## Section B — Loan Information

Fields:

```text
Loan Date
Original Loan Amount
Annual Interest Rate
```

Validation:

```text
Loan Date
required

Original Loan Amount
required
must be > 0

Annual Interest Rate
required
must be >= 0
must be <= 100
```

---

## Prototype Account Creation

When the loan is created:

1. generate a mock customer ID;
2. generate a mock loan ID;
3. add the loan to prototype state;
4. use the entered customer email as the customer login identifier;
5. assign prototype password:

```text
customer123
```

6. do not send any real email;
7. navigate to the new loan detail page.

Show success message:

```text
Loan created successfully.

Prototype customer login:
{customerEmail}
Password: customer123

No email was sent because this is a frontend prototype.
```

Do not expose this prototype password anywhere else after the creation confirmation.

---

# Page A4 — Admin Loan Details

## Route

```text
/admin/loans/:loanId
```

## Header

```text
← Back to Loans

{Customer Name}
Loan Details
```

Primary page action:

```text
Edit
```

When editing:

```text
Cancel
Save Changes
```

Use one page with view/edit states.

Do not create a separate edit route.

---

## Section A — Loan Summary

Display:

```text
Original Amount
Remaining Balance
Interest Rate
Loan Date
Minimum Monthly Payment
Estimated Payoff Date
```

### Editable in Admin Edit Mode

```text
Original Amount
Interest Rate
Loan Date
```

### Read-only

```text
Remaining Balance
Minimum Monthly Payment
Estimated Payoff Date
```

Remaining Balance must not be manually edited.

The assignment explicitly treats payment-received adjustments as external to this application.

---

## Section B — Customer Information

Display:

```text
Customer Name
Email Address
Phone Number
```

All three editable in admin edit mode.

---

## Section C — Automatic Payment Account

If no account:

```text
No bank account has been configured.
```

If configured:

```text
Bank Name
Account Type
Routing Number
Account Number
```

In view mode, mask sensitive numbers.

Example:

```text
Routing Number   •••••1234
Account Number   •••••6789
```

In edit mode:

- bank name editable;
- account type editable;
- provide fields to replace routing/account numbers.

Do not pre-fill secret fields with masked strings.

---

## Section D — Automatic Payment Schedule

If none:

```text
No automatic payment schedule has been configured.
```

If present display:

```text
Frequency
Payment Amount
Schedule Day
Minimum Required Payment
Next Payment Date
Estimated Payoff Date
```

Admin may edit:

- frequency;
- payment amount;
- schedule day.

Use exactly the same payment scheduling validation rules as the customer page.

---

## Saving

Use one:

```text
Save Changes
```

for the page.

On success:

- persist to localStorage;
- exit edit mode;
- recalculate derived values;
- show:

```text
Changes saved successfully.
```

---

# 18. CUSTOMER PORTAL

---

# Page C1 — Customer Login

## Route

```text
/customer/login
```

## Purpose

Simulate login to a customer account.

Fields:

```text
Email
Password
```

Primary action:

```text
Log In
```

## Default Demo Account

```text
Email: jane@example.com
Password: customer123
```

Show demo credentials below the form.

## Dynamic Created Accounts

Any customer created through the admin `Create New Loan` page may also log in using:

```text
Email: email used when creating the loan
Password: customer123
```

## Success

Navigate:

```text
/customer/loan
```

## Invalid

Display:

```text
Invalid email or password.
```

---

# Page C2 — My Loan

## Route

```text
/customer/loan
```

## Page Title

```text
My Loan
```

## Main Balance

Prominently display:

```text
Remaining Balance
$18,420.32
```

## Loan Details

Display:

```text
Loan Date
Original Loan Amount
Annual Interest Rate
Minimum Monthly Payment
Estimated Payoff Date
```

## Payoff Date Without Schedule

If no automatic payment schedule:

```text
Estimated Payoff Date
Set up automatic payments to calculate your payoff date.
```

Action:

```text
Set Up Payments
```

goes to:

```text
/customer/payments
```

## Existing Payment Schedule

Show compact summary:

```text
Payment Amount
Frequency
Schedule
Next Payment Date
```

Action:

```text
Manage Payments
```

goes to:

```text
/customer/payments
```

Do not put profile editing on this page.

---

# Page C3 — Profile

## Route

```text
/customer/profile
```

## Page Title

```text
Profile
```

## Description

```text
Manage your contact information and automatic payment account.
```

---

## Section A — Personal Information

Fields:

```text
Name
Email Address
Phone Number
```

All editable.

Validation:

- name required;
- email required;
- phone required.

Button:

```text
Save Personal Information
```

Disabled until a change exists.

Success:

```text
Personal information saved.
```

If customer email changes, update the prototype login email as well.

Password remains:

```text
customer123
```

---

## Section B — Bank Account

If none:

```text
No bank account has been added.
[ Add Bank Account ]
```

When adding:

```text
Bank Name
Account Type
Routing Number
Account Number
```

Account type options:

```text
Checking
Savings
```

Treat routing/account numbers as strings.

Do not convert them to numbers.

---

## Existing Bank Account

Display:

```text
Bank Name
Account Type
Routing Number   •••••1234
Account Number   •••••6789
```

Action:

```text
Change Bank Account
```

Replacement form starts with routing/account fields empty.

Success:

```text
Bank account information saved.
```

After save:

- persist raw prototype values to localStorage;
- display only masked versions in the page;
- clear raw form values from active component state.

This is only a prototype and does not represent production-grade storage of bank data.

---

# Page C4 — Automatic Payments

## Route

```text
/customer/payments
```

## Page Title

```text
Automatic Payments
```

## Description

```text
Choose how often you want to make automatic loan payments.
```

---

## Current Schedule

If a schedule already exists, show:

```text
Current Schedule

Payment Amount
Frequency
Schedule
Minimum Required Payment
Next Payment Date
Estimated Payoff Date
```

Keep the editable form on the same page.

---

## Step 1 — Frequency

Exactly three options:

```text
Monthly
Bi-weekly
Weekly
```

Do not add other options.

---

## Step 2 — Schedule Day

### Monthly

Use:

```text
Day of Month
```

Allowed values:

```text
1–28
```

### Bi-weekly

Use:

```text
Day of Week
```

Allowed:

```text
Monday
Tuesday
Wednesday
Thursday
Friday
Saturday
Sunday
```

### Weekly

Same day-of-week options.

---

## Step 3 — Minimum Payment

When frequency changes:

1. run the shared prototype amortization calculation;
2. update the minimum;
3. display:

```text
Minimum required payment: $X.XX
```

Bi-weekly must use:

```text
26 payments per year
```

Weekly must use:

```text
52 payments per year
```

Monthly must use:

```text
12 payments per year
```

---

## Step 4 — Payment Amount

Field:

```text
Payment Amount
```

Requirements:

- required;
- must be >= current minimum.

If too low:

```text
Payment must be at least $223.02.
```

Disable save while invalid.

---

## Bank Account Requirement

If no bank account exists:

Show warning:

```text
Add a bank account before scheduling automatic payments.
```

Action:

```text
Go to Profile
```

Route:

```text
/customer/profile
```

The scheduling form may remain visible but `Save Schedule` must be disabled.

---

## Estimated Payment Plan

When form is valid, display:

```text
Estimated Payment Plan

Payment             $250.00
Frequency           Bi-weekly
Estimated Payoff    September 2030
```

Use the shared prototype calculation.

Do not generate contradictory calculations in multiple components.

---

## Save

Button:

```text
Save Schedule
```

On success:

- persist schedule;
- update calculated payoff;
- remain on page;
- show:

```text
Payment schedule saved.
```

---

# 19. Form Validation Rules

All validation must be visible adjacent to the field.

Do not use only toast messages for field errors.

## Required Fields

Mark clearly.

## Currency

Allow:

```text
25000
25000.5
25000.50
```

Normalize display as needed.

Reject:

- negative values where not permitted;
- more than two meaningful decimal places if the component enforces that.

## Percentage

Allow decimals.

Example:

```text
6.25
```

## Email

Use a normal email input and simple validation.

## Phone

Require non-empty reasonable text.

Do not over-engineer formatting.

## Account Numbers

Use text inputs with:

```text
inputMode="numeric"
```

if desired.

Preserve leading zeroes.

---

# 20. Shared Components

Create reusable components.

Recommended:

```text
src/components/
  layout/
    AppLayout.tsx
    Header.tsx
    Sidebar.tsx
    PageHeader.tsx

  ui/
    Button.tsx
    Card.tsx
    TextInput.tsx
    CurrencyInput.tsx
    PercentageInput.tsx
    Select.tsx
    RadioGroup.tsx
    FormField.tsx
    Alert.tsx
    Skeleton.tsx
    EmptyState.tsx

  loan/
    LoanSummary.tsx
    CustomerInformation.tsx
    BankAccountSummary.tsx
    PaymentScheduleSummary.tsx
    PaymentScheduleForm.tsx
```

Do not implement each page as one enormous component.

---

# 21. Suggested Page File Structure

```text
src/pages/
  admin/
    AdminLoginPage.tsx
    AdminLoansPage.tsx
    CreateLoanPage.tsx
    AdminLoanDetailsPage.tsx

  customer/
    CustomerLoginPage.tsx
    CustomerLoanPage.tsx
    CustomerProfilePage.tsx
    CustomerPaymentsPage.tsx
```

---

# 22. Initial Mock Data

Seed at least three active loans and one fully repaid loan.

Example default customer:

```text
Jane Smith
jane@example.com
(555) 555-1234
```

Example loan:

```text
Loan Date:          2026-08-14
Original Amount:    $25,000.00
Remaining Balance:  $18,420.32
Interest Rate:      6.25%
```

Include:

1. partially repaid loan with bank account and schedule;
2. partially repaid loan without bank account/schedule;
3. another active loan for table sorting/search;
4. fully repaid loan with remaining balance `0` that does not appear in Active Loans.

---

# 23. Mock Bank Data

Use obviously fictional data.

Never use a real person's real account information.

Example:

```text
Bank Name: Example National Bank
Account Type: Checking
Routing Number: 000012345
Account Number: 000987654321
```

Display masked:

```text
Routing Number: •••••2345
Account Number: ••••••••4321
```

---

# 24. Prototype Reset

Provide a small development helper for resetting prototype state.

This does not need to be a visible production-style menu item.

Acceptable options:

- exported utility called from console/development code;
- small `Reset Demo Data` action only when `import.meta.env.DEV` is true.

Reset must:

1. clear saved prototype state;
2. restore original mock data;
3. clear mock login state.

---

# 25. Acceptance Criteria

## Admin Login

- Correct demo credentials log in.
- Incorrect credentials show error.
- Session persists through refresh.
- Logout works.

## Active Loans

- Shows only loans with remaining balance > 0.
- Shows all required columns.
- Search works.
- Sorting works.
- View opens correct loan.
- New Loan opens creation page.

## Create New Loan

- Required fields validate.
- New loan persists.
- New customer can log in.
- Confirmation explicitly says no real email was sent.
- Created loan appears in Active Loans.

## Admin Loan Details

- Shows all required loan data.
- Shows customer contact information.
- Shows masked bank information.
- Shows payment schedule.
- Admin can edit allowed values.
- Remaining balance stays read-only.
- Calculated values update after edits.

## Customer Login

- Default customer can log in.
- Newly created customers can log in.
- Invalid credentials show error.

## My Loan

- Shows required loan fields.
- Shows minimum payment.
- Shows payoff date when schedule exists.
- Correctly links to Payments.

## Profile

- Name/email/phone can be edited.
- Changes persist.
- Bank account can be added/replaced.
- Displayed account values are masked.

## Payments

- Only monthly, bi-weekly, weekly exist.
- Correct schedule-day control appears.
- Minimum changes by frequency.
- Payment below minimum cannot save.
- Bank account is required.
- Schedule persists.
- Estimated payoff updates.

---

# 26. Important Gemini Instruction

Do not invent features.

Implement exactly the pages, fields, interactions, and states in this specification.

Because this is a prototype:

- do not create a backend;
- do not create Spring controllers;
- do not create a database;
- do not create REST endpoints;
- do not configure MySQL;
- do not send email;
- do not integrate real banking/payment services.

Use the mock service layer as if it were the future backend boundary.

When something is ambiguous, prefer the smallest implementation consistent with this specification rather than adding a new feature.
