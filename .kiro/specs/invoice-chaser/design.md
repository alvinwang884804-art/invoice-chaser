# Design — Invoice Chaser

> **Build note (Nov 13, 2026):** this design originally specified SQLite via
> Prisma, but Prisma v8 (the version installed in the build environment) is a
> cloud-platform CLI with no SQLite support, and Prisma ORM v5 engine binaries
> could not download. The build therefore uses `better-sqlite3` directly with a
> hand-written type-safe db layer (`src/lib/db/`). The data model is unchanged
> and is documented in `prisma/schema.prisma` for a future Postgres migration.
> Everything else in this document stands as written.

## Overview

A single Next.js application (App Router, TypeScript) with a SQLite database
via Prisma. One codebase serves the dashboard UI and the API. External
services (email, SMS, payments) sit behind interfaces with simulated
implementations, so the app runs fully offline for judging and demo.

## Architecture

```
Browser (mobile-first UI)
    │  Next.js App Router pages + API routes
    ▼
Service layer (src/lib/)
    ├── invoices, clients, payments — CRUD + totals
    ├── reminders — schedule engine (pure functions)
    └── providers — EmailProvider / SmsProvider (demo + real impls)
    ▼
Prisma → SQLite (dev/demo) / Postgres (production)
```

## Data model

- **Client** — id, name, email?, phone?, notes, createdAt.
  At least one of email/phone is required.
- **Invoice** — id, clientId, number, amountCents (integer), dueDate,
  status (sent | overdue | paid), paymentLink?, createdAt.
  Status is derived: paid when balance is zero; overdue when unpaid and
  dueDate is past; otherwise sent.
- **Payment** — id, invoiceId, amountCents, paidAt, method? (cash, card,
  e-transfer, other).
- **Reminder** — id, invoiceId, step (1/7/14/30), channel (email | sms),
  templateId, sentAt, status (sent | skipped | failed), note?.
- **Template** — id, step, channel, subject? (email only), body with
  placeholders {{clientName}} {{invoiceNumber}} {{amount}} {{dueDate}}.

## Reminder engine

Pure function: `dueReminders(invoice, today) → ReminderStep[]`.
For an unpaid invoice, the steps due are those whose day-threshold
(1, 7, 14, 30 days overdue) has been reached and which have no logged
reminder yet. A daily (or on-demand "Run reminders") pass evaluates every
unpaid invoice, renders the matching template, sends via the provider,
and logs the result. Paid invoices are never evaluated.

Tone ladder: day 1 friendly email ("a quick nudge"), day 7 friendly SMS,
day 14 firm email ("second notice"), day 30 firm SMS + flag for personal
follow-up. Templates are editable; defaults are polite and human.

## Interfaces

- `EmailProvider.send(to, subject, body) → { ok, messageId? }`
- `SmsProvider.send(to, body) → { ok, messageId? }`
- Demo implementations log the send to the Reminder table and return ok.
  Real implementations (Resend/SendGrid, Twilio) are drop-in replacements.

## UI screens

1. **Dashboard** — KPI cards (outstanding, overdue, recovered this month,
   overdue count) + top-5 most overdue + recent reminder activity.
2. **Invoices** — table with status filter, search, add/import (CSV),
   detail view with reminder timeline and payment history.
3. **Clients** — list + detail with outstanding balance and invoices.
4. **Reminders** — log of all reminders sent/skipped + template editor.

## Testing

- Vitest unit tests: overdue-day math, reminder scheduling (all four steps,
  paid-invoice exclusion, missing-channel skip), money totals (integer cents).
- Property-based tests for date arithmetic (due dates across month/year
  boundaries, leap years).
- Seed script loads fictional demo data on first run.

## Out of scope (MVP)

Multi-user auth, real payment processing, QuickBooks/Xero sync, recurring
invoices, multi-currency. Each is a named follow-up, not a silent gap.
