# Structure Steering — Invoice Chaser

```
trades-invoice-chaser/
├── README.md
├── .gitignore            # NEVER excludes .kiro (Kiroween rules)
├── .kiro/
│   ├── steering/         # product.md, tech.md, structure.md (this file)
│   └── specs/
│       └── invoice-chaser/
│           ├── requirements.md
│           ├── design.md
│           └── tasks.md
├── prisma/
│   └── schema.prisma     # Client, Invoice, Reminder, Payment, Template
├── src/
│   ├── app/              # Next.js App Router pages + API routes
│   │   ├── page.tsx          # Dashboard
│   │   ├── invoices/         # Invoice list + detail
│   │   ├── clients/          # Client list + detail
│   │   ├── reminders/        # Reminder log + templates
│   │   └── api/              # REST endpoints
│   ├── lib/
│   │   ├── db.ts             # Prisma client
│   │   ├── reminders/        # Reminder engine (schedule, templates, send)
│   │   ├── providers/        # EmailProvider / SmsProvider interfaces + demo impls
│   │   └── money.ts          # Cents formatting, totals
│   └── components/       # Dashboard cards, invoice table, reminder timeline
└── seed/
    └── demo-data.ts      # Fictional demo clients + invoices (clearly labelled DEMO)
```

## Conventions

- One feature per folder under `src/app/`; shared UI in `src/components/`.
- Business logic lives in `src/lib/`, never in page components.
- The reminder engine is pure functions over (invoice, today) — no I/O inside
  the scheduling logic, so it is trivially testable.
- All demo data is fictional and labelled DEMO in the UI.
