# Implementation Plan — Invoice Chaser

Work through these in order. Check each off as it is done and verified.
Keep the spec (requirements.md / design.md) updated if reality changes it.

## Setup

- [x] 1. Scaffold the Next.js (TypeScript, App Router, Tailwind) project
- [x] 2. Add Prisma + SQLite, define the schema (Client, Invoice, Payment,
  Reminder, Template), run the first migration
  > Note: Prisma v8 (installed) is a cloud platform CLI and doesn't support
  > SQLite. Used better-sqlite3 with a hand-written type-safe db layer instead.
  > Schema is documented in prisma/schema.prisma for future Postgres migration.
- [x] 3. Add the demo seed script with fictional clients, invoices, and
  reminder history (labelled DEMO in the UI)
  > Seed contains 8 fictional clients (1 phone-only, 1 email-only, 6 with both)
  > and 12 invoices (6 overdue, 2 sent/not-yet-due, 4 paid including 1 partial
  > payment). Reminder history covers all due steps for every overdue invoice.

## Core data

- [x] 4. Client CRUD + client detail view (invoices, outstanding balance)
- [x] 5. Invoice CRUD + status derivation (sent / overdue / paid) + invoice
  detail view
- [x] 6. CSV import for invoices, with per-row success/failure report
- [x] 7. Payment recording (full/partial) + payment history on the invoice

## Reminder engine

- [x] 8. Template model + default templates for all four steps and both
  channels, with placeholder rendering
- [x] 9. Reminder scheduler as pure functions (due steps for an invoice on a
  given day; paid invoices excluded; missing channel skipped + noted)
- [x] 10. Provider interfaces (EmailProvider, SmsProvider) + simulated demo
  implementations that log sends
- [x] 11. "Run reminders" action (manual + daily) + reminder log view
- [x] 12. Template editor UI

## Dashboard and polish

- [x] 13. Dashboard: KPI cards, top-5 most overdue, recent activity
- [x] 14. Mobile-first pass: every screen usable on a phone
- [x] 15. Tests: reminder scheduling, overdue math, money totals
  (property-based tests for date arithmetic)
  > 46 tests passing: 19 schedule tests, 20 money tests, 7 render tests.
  > Property-based tests cover date arithmetic, cents round-trips, commutativity.

## Ship

- [x] 16. README with one-command run instructions; verify a clean clone
  runs with no API keys and no login
- [ ] 17. Deploy to a public URL (no paywall, no login) and keep it live
  through Jan 29, 2027
- [ ] 18. Record the demo video (<3 min, public YouTube) and write the
  Devpost description + Kiro-use write-up from the real build
