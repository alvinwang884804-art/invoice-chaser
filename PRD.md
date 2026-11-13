# Product Requirements Document — Invoice Chaser

**Project:** Invoice Chaser (Trades Invoice Chaser)
**Hackathon:** Kiroween 2026 — Frankenstein category
**Entrant:** Alvin Wang (solo)
**Deadline:** Friday, December 4, 2026, 2:00 PM Pacific Time
**Status:** MVP scope — build this, nothing more, before the deadline.

## 1. Problem

Small trades businesses — plumbers, HVAC techs, electricians, 1–5 person
shops — send invoices after the job and never follow up. Chasing money
costs billable hours, feels awkward, and falls to the bottom of the list.
Late payment is the norm, and every unpaid invoice is work already done
for free.

## 2. Users

- **Primary:** solo tradespeople and tiny shops with no office staff.
- They invoice after the job, work from their phones between jobs, and
  are not accountants. No jargon, no accounting workflows.
- Their customers are homeowners and property managers who usually pay
  when nudged — they are busy, not unwilling.

## 3. Product

Invoice Chaser recovers overdue invoices automatically. The owner imports
invoices once; the app sends a friendly-to-firm sequence of email and SMS
reminders, attaches a one-click payment link, and shows exactly what is
outstanding, overdue, and recovered.

**Validation:** the idea ranked #1 in a Nov 13, 2026 scan of Reddit, X,
and RedNote (ranked by fit and speed to revenue). A Reddit post validating
this exact product received 3,536 upvotes; a real operator reports
$14,000/month from it. Market: 600,000+ trades businesses in the US.
Price: $29–49/month. One recovered $500 invoice pays for a year.

**Frankenstein fit:** the app stitches together technologies that do not
naturally live together — accounting data (invoice import), messaging
(email + SMS), payments (payment links), and a live dashboard — into one
automated workflow. The stitching is the product.

## 4. Goals and non-goals

**Goals (MVP):**
- G1. An owner can see everything owed, overdue, and recovered in 10 seconds.
- G2. Overdue invoices are chased automatically — no manual follow-up.
- G3. Reminders sound like a polite human, never a collection agency.
- G4. A judge can run and test every feature with no login, no API key,
  and no paid service.

**Non-goals (MVP):** full accounting (ledger, tax, payroll), CRM features,
invoice creation as a primary tool, multi-user auth, real payment
processing, QuickBooks/Xero sync, recurring invoices, multi-currency.

## 5. Features (MVP)

1. **Dashboard** — total outstanding, total overdue, recovered this month,
   overdue count, five most overdue invoices, recent reminder/payment activity.
2. **Invoices** — add (client, amount, due date), list with status
   (sent / overdue / paid), days overdue, detail view with reminder
   timeline and payment history; CSV import with a per-row report.
3. **Clients** — add (name + email and/or phone), list, detail with
   outstanding balance and invoices.
4. **Reminder engine** — automatic reminders at 1, 7, 14, and 30 days
   overdue, alternating email and SMS, tone friendly → firm; day 30 also
   flags the invoice for personal follow-up. Every reminder is logged.
   Paid invoices stop all reminders. Missing contact channel = skip + note.
5. **Templates** — one editable template per step and channel, with
   placeholders for client name, invoice number, amount, balance,
   due date, and days overdue.
6. **Payments** — record full or partial payments manually; balance and
   status update; payment history per invoice.
7. **Demo mode** — fictional demo data (8 clients, 12 invoices) clearly
   labelled DEMO; reminder sends simulated and logged visibly; no real
   email, SMS, or payment service is ever called.

## 6. User stories (summary)

- As a tradesperson, I see what I am owed at a glance before my first job.
- As a tradesperson, I record invoices in seconds and never lose track.
- As a tradesperson, overdue invoices are chased for me automatically.
- As a tradesperson, reminders sound like me — nudged, not offended.
- As a tradesperson, I record payments easily and the dashboard stays true.
- As a judge, I test every feature without accounts or API keys.

Full acceptance criteria: `.kiro/specs/invoice-chaser/requirements.md`.
Architecture and data model: `.kiro/specs/invoice-chaser/design.md`.
Build order: `.kiro/specs/invoice-chaser/tasks.md`.

## 7. Success criteria

- All 18 tasks in `tasks.md` complete; dashboard math verified against
  hand-computed totals; reminder engine tested at all four steps.
- Clean clone runs with one command, no API keys, no login.
- Demo video (<3 min) shows the full loop: overdue invoice → reminder
  sent → payment recorded → dashboard updated.

## 8. Constraints

- Money stored as integer cents; displayed in USD.
- Dates stored UTC, displayed local; overdue = calendar days past due.
- No real customer data anywhere in the repo — fictional demo data only.
- `/.kiro` must be committed at the repo root (Kiroween rules) and must
  never appear in `.gitignore`.
