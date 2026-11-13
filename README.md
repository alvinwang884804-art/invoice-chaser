# Invoice Chaser ⚡

**Automated invoice reminders for small trades businesses.** One recovered invoice pays for a year of the product.

> Built for the Kiroween 2026 Hackathon.

## What it does

Invoice Chaser helps plumbers, HVAC techs, electricians, and general contractors chase overdue invoices automatically — so they can stay on the tools instead of chasing payments.

- **Dashboard** — outstanding total, overdue total, recovered this month, and invoices that need attention
- **Invoices** — add, import (CSV), and track invoices with status (sent / overdue / paid)
- **Clients** — customer directory with contact details for reminders
- **Reminder engine** — auto email + SMS at 1, 7, 14, and 30 days overdue; tone goes friendly → firm
- **Templates** — editable reminder wording with live placeholders
- **Payments** — record full or partial payments; dashboard updates immediately

## Run in one command

```bash
npm install && npm run setup && npm run dev
```

Then open **http://localhost:3000** — no login, no API keys, no paid services required.

## What `npm run setup` does

1. Creates the SQLite database at `data/invoice-chaser.db`
2. Seeds it with fictional DEMO clients, invoices, and reminder history (clearly labelled in the UI)

## Available scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run setup` | Create the DB and seed DEMO data |
| `npm run db:seed` | Re-seed DEMO data (resets existing data) |
| `npm test` | Run all tests (Vitest) |

## Stack

- **Next.js 16** (App Router, TypeScript) — UI + API in one codebase
- **SQLite via better-sqlite3** — zero setup, no server needed
- **Tailwind CSS 4** — mobile-first
- **Vitest + fast-check** — unit + property-based tests for the reminder engine and money math

## Architecture

```
src/
├── app/           ← Next.js pages and API routes
│   ├── page.tsx       ← Dashboard
│   ├── invoices/      ← Invoice list + detail
│   ├── clients/       ← Client list + detail
│   ├── reminders/     ← Reminder log + template editor
│   └── api/           ← REST endpoints
├── lib/
│   ├── db/            ← SQLite queries (clients, invoices, payments, reminders, templates)
│   ├── reminders/     ← Pure scheduling functions + template renderer + runner
│   ├── providers/     ← EmailProvider / SmsProvider interfaces + demo implementations
│   └── money.ts       ← Integer-cents math (never float money)
└── __tests__/     ← Vitest tests
seed/
└── demo-data.ts   ← Fictional DEMO seed (8 clients, 12 invoices, payment history)
prisma/
└── schema.prisma  ← Data model reference (for future Postgres migration)
```

## Demo mode

All data loaded at startup is clearly fictional and labelled **DEMO** in the UI. Reminders in demo mode are simulated — they log the send in the Reminder table and print to the console but never call Resend, Twilio, or any real service.

To test the full reminder flow: go to **Reminders → Run Reminders**. The engine evaluates all unpaid invoices, sends any due steps via the demo provider, and logs everything.

## Extending to production

| Feature | What to do |
|---|---|
| Real email | Implement `EmailProvider` with Resend or SendGrid; swap in `src/lib/providers/` |
| Real SMS | Implement `SmsProvider` with Twilio |
| Postgres | Change `DATABASE_URL` to a Postgres URL — the SQLite schema maps 1:1 |
| Auth | Add NextAuth.js or Clerk; the single-user assumption is an MVP simplification |
| Stripe payment links | Generate a Stripe Payment Link per invoice and store in `paymentLink` |

## Tests

```bash
npm test
```

46 tests covering:
- Reminder scheduling (all four steps, paid-invoice exclusion, missing-channel skip)
- Property-based date arithmetic (month/year boundaries, leap years)
- Money math (cents formatting, parsing, totals — never float)
- Template rendering (all placeholders, multiple occurrences)
