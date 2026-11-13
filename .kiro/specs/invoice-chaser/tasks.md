# Implementation Plan — Invoice Chaser

Work through these in order. Check each off as it is done and verified.
Keep the spec (requirements.md / design.md) updated if reality changes it.

## Setup

- [ ] 1. Scaffold the Next.js (TypeScript, App Router, Tailwind) project
- [ ] 2. Add Prisma + SQLite, define the schema (Client, Invoice, Payment,
  Reminder, Template), run the first migration
- [ ] 3. Add the demo seed script with fictional clients, invoices, and
  reminder history (labelled DEMO in the UI)

## Core data

- [ ] 4. Client CRUD + client detail view (invoices, outstanding balance)
- [ ] 5. Invoice CRUD + status derivation (sent / overdue / paid) + invoice
  detail view
- [ ] 6. CSV import for invoices, with per-row success/failure report
- [ ] 7. Payment recording (full/partial) + payment history on the invoice

## Reminder engine

- [ ] 8. Template model + default templates for all four steps and both
  channels, with placeholder rendering
- [ ] 9. Reminder scheduler as pure functions (due steps for an invoice on a
  given day; paid invoices excluded; missing channel skipped + noted)
- [ ] 10. Provider interfaces (EmailProvider, SmsProvider) + simulated demo
  implementations that log sends
- [ ] 11. "Run reminders" action (manual + daily) + reminder log view
- [ ] 12. Template editor UI

## Dashboard and polish

- [ ] 13. Dashboard: KPI cards, top-5 most overdue, recent activity
- [ ] 14. Mobile-first pass: every screen usable on a phone
- [ ] 15. Tests: reminder scheduling, overdue math, money totals
  (property-based tests for date arithmetic)

## Ship

- [ ] 16. README with one-command run instructions; verify a clean clone
  runs with no API keys and no login
- [ ] 17. Deploy to a public URL (no paywall, no login) and keep it live
  through Jan 29, 2027
- [ ] 18. Record the demo video (<3 min, public YouTube) and write the
  Devpost description + Kiro-use write-up from the real build
