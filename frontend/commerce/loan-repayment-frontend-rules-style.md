# Loan Repayment Tracker — Frontend Rules & Style Specification

## 1. Purpose

This document defines **how the frontend prototype must be implemented and how it must look**.

Functional requirements belong in:

`loan-repayment-frontend-content-spec.md`

This separation is intentional.

If the visual style changes later, update this file without changing page behavior unless explicitly requested.

---

# 2. Required Stack

Use exactly:

```text
React
TypeScript
Vite
React Router
Tailwind CSS
```

Recommended small dependencies:

```text
lucide-react
clsx
tailwind-merge
```

React Hook Form is optional.

Do not add a large UI framework unless explicitly requested.

Do not use:

- Material UI;
- Ant Design;
- Chakra UI;
- Bootstrap;
- a purchased/admin dashboard template;
- Redux;
- MobX;
- Zustand unless state complexity later requires it.

For this prototype, React state/context + mock services + localStorage are sufficient.

---

# 3. Prototype-Only Engineering Rules

This is frontend only.

Do not generate:

- Spring code;
- Java code;
- REST controllers;
- database schemas;
- MySQL configuration;
- Docker services;
- authentication servers;
- email integration;
- payment integration.

All data interaction must go through mock async services.

Do not hard-code mock data in page components.

Pages should be written as though the service layer could later be replaced by a real API.

---

# 4. Visual Direction

The visual direction is:

> **Traditional modern bank**

The interface should feel:

- trustworthy;
- conservative;
- professional;
- structured;
- clear;
- mildly dense;
- current without being trendy.

Reference mood:

- large US bank portal;
- clean internal finance software;
- modern enterprise banking interface.

It should not look like:

- a fintech marketing page;
- a crypto product;
- a startup landing page;
- a generic AI-generated SaaS dashboard;
- a mobile app stretched to desktop.

---

# 5. Things to Avoid

Do not use:

- gradients;
- glassmorphism;
- neon;
- purple startup gradients;
- giant hero sections;
- oversized typography;
- huge cards with excessive empty space;
- floating rounded pills everywhere;
- 16–24px card radii;
- intense shadows;
- decorative charts;
- decorative illustrations;
- animated backgrounds;
- hover animations that move layout;
- emoji;
- dark mode;
- excessive badges;
- excessive icons.

Animations should be limited to small standard transitions:

```text
100–200 ms
```

for hover/focus/menu state changes.

---

# 6. Desktop Target

This prototype is desktop-only.

Primary design range:

```text
1280px–1920px
```

Primary reference viewport:

```text
1440 × 900
```

Minimum intended width:

```text
1024px
```

Do not implement:

- hamburger navigation;
- responsive mobile cards;
- bottom navigation;
- mobile drawers;
- special phone breakpoints.

Below 1024px, horizontal overflow is acceptable.

---

# 7. Design Tokens

Use centralized tokens.

Recommended CSS variables:

```css
--color-primary
--color-primary-hover
--color-primary-active
--color-primary-soft

--color-background
--color-surface
--color-surface-subtle

--color-text
--color-text-secondary
--color-text-muted

--color-border
--color-border-strong

--color-success
--color-success-soft
--color-warning
--color-warning-soft
--color-error
--color-error-soft

--radius-sm
--radius-md
--radius-lg

--shadow-card
--shadow-overlay
```

Do not scatter arbitrary hex values through page components.

---

# 8. Color Palette

## Primary

```text
Primary Navy          #12345B
Primary Hover         #0D2948
Primary Active        #091F37
Primary Soft          #EAF1F8
```

## Layout

```text
Application BG        #F5F7FA
Surface / Card        #FFFFFF
Subtle Surface        #F8FAFC
Sidebar BG            #0D2742
Sidebar Active BG     #173B61
```

## Text

```text
Primary Text          #172033
Secondary Text        #5E6B7A
Muted Text            #7B8794
Text on Navy          #FFFFFF
```

## Borders

```text
Standard Border       #D7DEE7
Strong Border         #BBC6D3
```

## Status

```text
Success               #197A55
Success Soft          #E9F6F0

Warning               #A45B08
Warning Soft          #FFF5E5

Error                 #B42318
Error Soft            #FDECEC
```

---

# 9. Color Rules

- Navy is the main action/brand color.
- Red is only for errors/destructive states.
- Green is only for success.
- Warning orange is only for warnings.
- Normal balances are not red.
- Normal positive financial values are not green.
- Avoid using color as the only indicator of meaning.

---

# 10. Typography

Preferred font:

```text
Inter
```

Fallback:

```css
Inter,
ui-sans-serif,
system-ui,
-apple-system,
BlinkMacSystemFont,
"Segoe UI",
sans-serif
```

Do not require a custom downloaded font if Inter is not already available.

---

# 11. Type Scale

Use approximately:

```text
Page Title           30px / 36px / 600
Page Subtitle        14px / 20px / 400
Section Title        18px / 26px / 600
Card Title           16px / 24px / 600
Body                 14px / 21px / 400
Body Emphasis        14px / 21px / 500
Field Label          13px / 18px / 600
Small Text           12px / 18px / 400
Table Header         12px / 18px / 600
Large Balance        32px / 38px / 600
```

Rules:

- sentence case;
- no decorative type;
- avoid all caps;
- use semibold sparingly;
- financial values should use tabular numerals when available.

---

# 12. Global Application Layout

Use:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ Header: 64px                                                            │
├───────────────────┬─────────────────────────────────────────────────────┤
│ Sidebar: 240px    │ Main Content                                        │
│                   │                                                     │
│                   │                                                     │
└───────────────────┴─────────────────────────────────────────────────────┘
```

---

# 13. Header

Height:

```text
64px
```

Style:

- white;
- 1px bottom border;
- no heavy shadow;
- horizontal padding 24px;
- vertically centered.

Left:

```text
Loan Repayment Tracker
```

Right:

```text
User Name
Role
Log Out
```

The user name is stronger than role text.

`Log Out` should be a low-emphasis button/link.

---

# 14. Sidebar

Width:

```text
240px
```

Background:

```text
#0D2742
```

Navigation:

- vertically stacked;
- 40–44px item height;
- 12–16px horizontal padding;
- 6px radius;
- white/near-white text;
- current item uses `#173B61`;
- optional 3px left accent;
- optional Lucide icon.

If icons are used:

- one per nav item;
- 18–20px;
- always paired with text.

No icon-only navigation.

---

# 15. Main Content

Background:

```text
#F5F7FA
```

Padding:

```text
32px
```

Maximum useful content width:

```text
1280px
```

Keep content left-aligned.

Do not center dashboard content into a narrow article column.

---

# 16. Spacing System

Use a 4px base.

Preferred spacing values:

```text
4
8
12
16
20
24
32
40
48
```

Common spacing:

```text
Page padding             32px
Page title to body       24px
Section gap              24px
Card padding             24px
Form row gap             20px
Label to input            6px
Input to help/error       6px
Button gap                8–12px
```

Avoid arbitrary spacing values.

---

# 17. Border Radius

Use restrained radii.

```text
Small      4px
Medium     6px
Large      8px
```

Defaults:

```text
Cards      8px
Inputs     6px
Buttons    6px
```

Do not use giant rounded cards.

Do not make ordinary buttons pill-shaped.

---

# 18. Shadows

Cards:

```text
0 1px 2px rgba(16, 24, 40, 0.04)
```

Prefer borders over shadows.

Only overlays/dropdowns may use a stronger shadow.

---

# 19. Page Headers

Every authenticated page starts with:

```text
Page Title                              Optional Primary Action
Optional one-line description
```

Examples:

```text
Active Loans                            + New Loan
Manage loans that have not been fully repaid.
```

```text
Profile
Manage your contact information and automatic payment account.
```

Do not repeat the page title inside the first card.

---

# 20. Cards

Use cards to group meaningful sections.

Examples:

```text
Loan Summary
Customer Information
Automatic Payment Account
Payment Schedule
Personal Information
```

Card style:

```text
background: white
border: 1px solid #D7DEE7
border-radius: 8px
padding: 24px
subtle shadow
```

Do not create one huge card for the whole page.

Do not create one card per tiny metric either.

Aim for 2–4 meaningful sections on a detailed page.

---

# 21. Loan Summary Layout

Within a loan-summary card, use a compact grid.

Recommended:

```text
2 or 3 columns
```

Example:

```text
Original Amount        Remaining Balance       Interest Rate
$25,000.00             $18,420.32              6.25%

Loan Date              Minimum Payment         Estimated Payoff
08/14/2026             $483.21                 04/14/2031
```

Labels:

- small;
- muted;
- semibold/medium.

Values:

- 15–18px;
- strong;
- easy to scan.

Remaining Balance may be visually emphasized, but not with warning colors.

---

# 22. Buttons

Create reusable variants.

## Primary

Examples:

```text
Log In
Create Loan
Save Changes
Save Schedule
```

Style:

```text
background: #12345B
color: white
height: 40px
border-radius: 6px
font-weight: 500
padding: 0 16px
```

Hover:

```text
#0D2948
```

## Secondary

Examples:

```text
Cancel
Try Again
Change Bank Account
```

Style:

- white;
- border;
- dark/navy text.

## Tertiary

Examples:

```text
Back to Loans
Log Out
```

Style:

- transparent;
- text emphasis only.

## Destructive

Do not create unless a destructive action is later requested.

---

# 23. Button Rules

- One main filled action per form.
- Do not have three equal-weight primary buttons.
- Loading state must preserve button width.
- Disabled states should clearly appear disabled.
- Use icons only when they add clarity.
- Text must remain present on important actions.

---

# 24. Form Fields

All fields use persistent labels.

Correct:

```text
Email Address
[ jane@example.com                     ]
```

Incorrect:

```text
[ Email Address                        ]
```

Placeholder text may provide an example but must not replace a label.

---

# 25. Standard Input Style

Height:

```text
40px
```

Padding:

```text
10px 12px
```

Style:

```text
background: white
border: 1px solid #BBC6D3
border-radius: 6px
```

Focus:

- navy border;
- visible navy focus ring;
- no layout shift.

---

# 26. Required Fields

Use:

```text
Email Address *
```

If using `*`, include:

```text
* Required
```

once near the top of a form.

---

# 27. Error Text

Place immediately below the corresponding field.

Example:

```text
Payment Amount
[$ 150.00                             ]
Payment must be at least $223.02.
```

Error text:

- 12–13px;
- error red;
- concise.

Do not rely only on a toast.

---

# 28. Financial Inputs

## Currency

Show `$` as a prefix inside or adjacent to the input.

Allow normal typing.

Avoid spinner controls.

## Interest Rate

Show `%` suffix.

Example:

```text
Annual Interest Rate
[ 6.25                            ] %
```

## Routing and Account Numbers

Use text inputs.

May use:

```tsx
inputMode="numeric"
```

Do not use `type="number"` because leading zeroes must be preserved.

---

# 29. Tables

The Active Loans table is a major admin component.

Use a professional dense table.

## Header

- 12px semibold;
- muted dark text;
- subtle gray background;
- stronger bottom border.

## Rows

Height:

```text
48–52px
```

Use horizontal padding:

```text
16px
```

Row hover:

```text
subtle primary-soft or gray background
```

Clickable rows use:

```text
cursor-pointer
```

Do not animate row movement.

---

# 30. Table Alignment

Use:

```text
Customer          left
Loan Date         left
Amount Owed       right
Original Amount   right
Interest Rate     right
Action            right
```

Use tabular numbers for financial columns.

Do not center numeric columns.

---

# 31. Sort Headers

Sortable columns should show a small arrow/chevron.

Inactive sortable columns may show no icon until hover, or a faint generic sort icon.

Do not use large icons.

---

# 32. Search Field

Place search above the table, left aligned.

Recommended width:

```text
320px
```

Label is optional if an accessible `aria-label` is present, but the visible placeholder must be:

```text
Search by customer name
```

Use a small search icon if desired.

---

# 33. Login Pages

Login pages are the only pages without sidebar/header shell.

Background:

```text
#F5F7FA
```

Center card horizontally and vertically with slight upward bias.

Card:

```text
width: 400–440px
padding: 32px
```

Contents:

1. application name;
2. portal name;
3. optional one-line description;
4. fields;
5. Log In;
6. demo credentials box.

No decorative illustration.

---

# 34. Demo Credentials Box

Style:

- subtle navy/light blue background;
- small text;
- 1px border;
- not visually dominant.

Example:

```text
Demo credentials
Username: admin
Password: admin123
```

Clearly label as demo/prototype credentials.

---

# 35. Alerts

Create variants:

```text
success
warning
error
info
```

Use:

- soft tinted background;
- matching thin border;
- icon optional;
- concise text.

No toast-only critical feedback.

Page-level success may use either:

- inline alert;
- small toast plus visible updated data.

Field validation must stay inline.

---

# 36. Empty States

Keep compact.

Example:

```text
No active loans were found.

[ Create New Loan ]
```

Do not use large illustrations.

Do not use cute copy.

---

# 37. Loading States

Use skeletons.

## Table

Render 5–8 skeleton rows.

## Detail Pages

Render skeleton blocks corresponding to actual cards.

## Buttons

Use:

```text
Saving...
Creating...
Logging in...
```

Do not use a full-page spinner for every request.

---

# 38. Admin Loan Detail Layout

Recommended page flow:

```text
Back to Loans

Customer Name / Loan Details                  Edit

[ Loan Summary ]

[ Customer Information ]

[ Automatic Payment Account ]

[ Automatic Payment Schedule ]
```

Use full-width stacked cards.

Within cards, use multi-column grids.

This keeps the page visually conservative and easy to scan.

---

# 39. Admin Edit Mode

Do not redesign the entire page.

View mode values should turn into corresponding form controls inside the same cards.

Header action changes:

```text
Edit
```

to:

```text
Cancel   Save Changes
```

Highlighting edit mode with a subtle text indicator is acceptable.

Do not change the whole page background.

---

# 40. Customer My Loan Page

Recommended hierarchy:

```text
My Loan

[ Remaining Balance — visually emphasized ]

[ Loan Details ]

[ Automatic Payment Summary ]
```

The balance card may be somewhat larger than normal cards.

Avoid giant marketing-style typography.

Recommended balance value:

```text
32px
```

not:

```text
56–72px
```

---

# 41. Profile Page

Recommended layout:

```text
Profile

[ Personal Information ]

[ Automatic Payment Account ]
```

Use one card per section.

Do not mix personal contact fields and bank account replacement fields into one dense form.

---

# 42. Payment Scheduling Page

Recommended layout:

```text
Automatic Payments

[ Current Schedule ]        only if existing

[ Payment Schedule Form ]

[ Estimated Payment Plan ]
```

Frequency controls may use three compact selectable cards in one row:

```text
Monthly | Bi-weekly | Weekly
```

Each should behave like a radio option.

Do not make them huge.

---

# 43. Frequency Selection Style

Each option:

```text
border
6px radius
padding 16px
```

Selected:

- navy border;
- very light navy background;
- visible selected radio/check indicator.

Unselected:

- standard border;
- white background.

---

# 44. Estimated Payment Plan

This is informational, not a promotional card.

Use a subtle surface.

Example:

```text
Estimated Payment Plan

Payment             $250.00
Frequency           Bi-weekly
Estimated Payoff    September 2030
```

Use a definition-list/grid style.

Do not use charts.

---

# 45. Bank Account Masking

Always display masked sensitive values outside edit/add mode.

Use:

```text
•••••1234
```

Never show raw values in normal page views.

Prototype raw values may exist in localStorage only because this is a frontend mock.

Add a code comment explaining:

```text
Prototype only — do not store raw bank data in browser storage in production.
```

Do not add a giant warning to the visible UI unless requested.

---

# 46. Navigation Labels

Use exactly:

Admin:

```text
Loans
New Loan
```

Customer:

```text
My Loan
Profile
Payments
```

Do not rename to creative alternatives such as:

```text
Dashboard
Financial Hub
Repayment Center
Account Center
```

unless requested.

---

# 47. Copy Style

Use direct professional language.

Good:

```text
Payment schedule saved.
Unable to load loan information.
Payment must be at least $223.02.
```

Avoid:

```text
Awesome! You're all set!
Oops! Something went wrong :(
Let's get your finances on track!
```

No emojis.

No exclamation points unless truly necessary.

---

# 48. Accessibility Basics

Even for a prototype:

- every form input must have a label;
- buttons must be real `<button>` elements;
- navigation must use links;
- visible keyboard focus states required;
- clickable table rows must still provide a real `View` control;
- do not encode status only with color;
- use sufficient contrast;
- alerts should use appropriate accessible semantics when practical.

---

# 49. Component Reuse Rules

Do not duplicate visual patterns.

Required shared primitives should include:

```text
Button
Card
PageHeader
FormField
TextInput
CurrencyInput
PercentageInput
Select
Alert
Skeleton
```

Loan-specific reusable components should include:

```text
LoanSummary
CustomerInformation
BankAccountSummary
PaymentScheduleSummary
PaymentScheduleForm
```

If two pages contain the same payment-schedule behavior, reuse the same form component.

---

# 50. Tailwind Rules

Prefer reusable components over unreadable class strings copied everywhere.

Acceptable:

```tsx
<Button variant="primary">Save Changes</Button>
```

Prefer over repeating the same 20 Tailwind utility classes on every button.

Use Tailwind utilities for layout and local adjustments.

Use helper functions such as `cn()` for conditional classes.

Do not create dozens of one-off CSS files.

---

# 51. Suggested Source Structure

```text
src/
  api/
    mockAuthApi.ts
    mockAdminLoansApi.ts
    mockCustomerApi.ts
    mockPaymentApi.ts

  components/
    layout/
    ui/
    loan/

  data/
    mockData.ts

  pages/
    admin/
    customer/

  types/
    auth.ts
    loan.ts
    payment.ts

  utils/
    formatting.ts
    loanCalculations.ts
    prototypeStorage.ts

  router/
    AppRouter.tsx

  App.tsx
  main.tsx
```

---

# 52. State Management

Use:

- local component state;
- React Context for authentication if useful;
- localStorage-backed prototype services.

Do not add Redux.

Do not put the entire application state into one huge React context.

Keep state close to where it is used.

---

# 53. Mock Service API Shape

Make mock services resemble future real API modules.

Example:

```ts
export const mockAdminLoansApi = {
  getActiveLoans,
  getLoanById,
  createLoan,
  updateLoan,
};
```

Each method returns a Promise.

When backend work begins later, the page should be able to switch from:

```ts
mockAdminLoansApi
```

to:

```ts
adminLoansApi
```

with minimal UI changes.

---

# 54. Prototype Error Simulation

Do not randomly fail requests.

If error-state testing is desired, provide a clearly named developer flag:

```ts
const MOCK_FORCE_ERROR = false;
```

or dedicated development helper.

Normal demo behavior must remain deterministic.

---

# 55. No Backend Assumptions in UI Code

Do not create fake REST URLs such as:

```text
/api/admin/loans
```

for this prototype.

Do not configure Axios/fetch just to pretend a backend exists.

The async mock service boundary is enough.

---

# 56. Code Quality Rules

Use TypeScript strict mode where practical.

Avoid:

```ts
any
```

Prefer:

- explicit prop interfaces;
- typed service responses;
- typed form state;
- shared enums/unions.

Keep components focused.

If a component exceeds roughly 250–300 lines because it contains multiple unrelated responsibilities, split it.

---

# 57. No Unrequested Features

Gemini must not add:

- charts;
- transaction history;
- password reset;
- registration;
- dashboard KPI widgets;
- notifications;
- customer messaging;
- loan deletion;
- loan payment processing;
- document upload;
- dark mode;
- mobile navigation.

If something is not in the content specification, do not add it simply because it is common in banking software.

---

# 58. Final Visual Checklist

Before considering the prototype complete, verify:

- [ ] traditional modern-bank visual direction;
- [ ] navy + white + light gray palette;
- [ ] left sidebar;
- [ ] 240px sidebar;
- [ ] 64px header;
- [ ] desktop layout;
- [ ] restrained 6–8px radii;
- [ ] subtle borders/shadows;
- [ ] no gradients;
- [ ] no giant cards;
- [ ] no decorative charts;
- [ ] consistent button styles;
- [ ] consistent form fields;
- [ ] consistent page headers;
- [ ] professional copy;
- [ ] masked bank values;
- [ ] clear loading states;
- [ ] clear success/error states;
- [ ] no backend code;
- [ ] mock services separated from UI;
- [ ] localStorage persistence;
- [ ] reusable shared components.

---

# 59. Important Gemini Instruction

Treat this file as the authoritative design and implementation-rule document.

Do not improvise a different aesthetic.

Do not fill missing space with extra widgets.

Do not create backend code.

Do not introduce a mobile redesign.

Do not add product features that are not defined in the content specification.

When a visual choice is not explicitly described, choose the most conservative option consistent with a traditional professional banking portal.
