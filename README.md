# Invoice Chaser — Kiroween 2026 (Frankenstein)

**The problem:** plumbers, HVAC techs, and electricians send invoices and never follow up.
Late payment is the norm in the trades, and chasing money costs billable hours.

**The product:** an automated invoice chaser for small trades businesses. Import invoices,
and the app sends a friendly-to-firm sequence of email and SMS reminders, attaches a
one-click payment link, and shows exactly what is outstanding, overdue, and recovered.

**Why this idea:** it was the #1 ranked idea in the Nov 13, 2026 business-opportunity scan
(Reddit / X / RedNote), ranked by fit and speed to revenue. A Reddit post validating the
exact product got 3,536 upvotes, with a real operator reporting $14,000/month from it.
Market: 600,000+ trades businesses in the US. Price: $29–49/month. One recovered $500
invoice pays for a year of the product.

**Kiroween category: Frankenstein.** The app stitches together a chimera of technologies
that do not naturally live together — accounting data (invoice import), messaging
(email + SMS reminders), payments (payment links), and a live dashboard — into one
automated workflow. The stitching is the product.

## How to build this in Kiro

1. Open this folder as a project in Kiro (IDE, CLI, or Web).
2. Read the steering docs in `.kiro/steering/` (product, tech, structure).
3. Open the spec in `.kiro/specs/invoice-chaser/` — `requirements.md`, `design.md`,
   `tasks.md` — and work through the tasks. Use spec-driven development: implement
   task by task, keep the spec updated, and let Kiro create specs, hooks, and steering
   as you go. That evidence lives in `.kiro/` and is both a hard submission
   requirement and 20% of the judging score (Technological Implementation).
4. The demo runs without any API keys: email/SMS sends are simulated and logged
   in-app behind a provider interface, so judges can test everything free of charge.
   Real providers (email, SMS, Stripe links) plug into the same interfaces later.

## Submission notes

- New project, started November 13, 2026 — inside the submission window
  (Oct 30 – Dec 4, 2026). Nothing here predates Oct 30.
- Deadline: **Friday, December 4, 2026, 2:00 PM Pacific Time.** No extensions.
- The submission needs: this repo public on GitHub with an open-source licence and
  `/.kiro` at the root (never add `/.kiro` to `.gitignore` — that can disqualify),
  a public working-app URL live through Jan 29, 2027, a text description, a demo
  video under 3 minutes on public YouTube, and a write-up of how Kiro was used.
- Entrant: Alvin Wang (Devpost: alvinwang884804). Solo entry. 4,000 Kiro credits
  approved Nov 11, 2026 — redeem before Dec 4 (link in the laurel@devpost.com email).
- A working prototype of this same product exists as a reference implementation
  (built alongside this setup pack). The Kiro build in this folder is the submission,
  not the prototype — the prototype is a reference for features and behaviour only.
