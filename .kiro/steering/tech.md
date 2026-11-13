# Tech Steering — Invoice Chaser

## Stack

- **Language:** TypeScript throughout.
- **Framework:** Next.js (App Router) — one codebase for UI and API.
- **Database:** SQLite via Prisma for local dev and the demo (zero setup,
  judges can run it with one command). Postgres via the same Prisma schema
  for production.
- **Styling:** Tailwind CSS. Mobile-first; the primary user is on a phone.
- **Testing:** Vitest for the reminder engine and money math. Property-based
  tests for date/overdue calculations (due-date arithmetic is where bugs hide).

## Integrations (all behind interfaces)

- **Email** — `EmailProvider` interface. Demo: simulated provider that logs
  the send in-app. Real: Resend or SendGrid.
- **SMS** — `SmsProvider` interface. Demo: simulated provider that logs the
  send in-app. Real: Twilio.
- **Payments** — payment links per invoice. Demo: link recorded on the invoice,
  payment marked manually. Real: Stripe Payment Links.

Rule: the app must run end to end with **no API keys and no paid services**.
A judge clones the repo, runs one command, and can test every feature.

## Money

- All amounts stored as integer cents. Never float money.
- Currency: USD for the demo data (US trades market). One currency only in MVP.

## Dates

- All dates stored as UTC timestamps; displayed in the user's local timezone.
- Overdue days = calendar days past the due date. Due date itself is not overdue.

## Security (MVP scope)

- Single-user demo: no login in the MVP (judges test free of charge, no
  accounts). Multi-user auth is out of scope for the hackathon build.
- Never store real customer phone numbers or emails in the repo — demo data
  only, clearly fictional.
