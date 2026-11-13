# Requirements — Invoice Chaser

## Introduction

Invoice Chaser helps small trades businesses recover overdue invoices with
automated, friendly-to-firm email and SMS reminders. The owner imports
invoices; the app chases payment and shows what is outstanding, overdue,
and recovered.

## Glossary

- **Client:** the trades business's customer (homeowner, property manager).
- **Invoice:** a bill for completed work: client, amount, due date, status.
- **Reminder:** one email or SMS sent for an overdue invoice, logged with
  timestamp, channel, template, and outcome.
- **Overdue:** an unpaid invoice whose due date is in the past.

## Requirements

### Requirement 1 — Dashboard

**User Story:** As a tradesperson, I want to see at a glance what I am owed,
so I know where I stand before my first job of the day.

#### Acceptance Criteria

1. WHEN the dashboard loads, THE SYSTEM SHALL show total outstanding,
   total overdue, amount recovered this month, and count of overdue invoices.
2. WHEN there are overdue invoices, THE SYSTEM SHALL list the five most
   overdue first, with client name, amount, and days overdue.
3. WHEN all invoices are paid, THE SYSTEM SHALL show a zero state that says
   nothing is outstanding.

### Requirement 2 — Invoices

**User Story:** As a tradesperson, I want to record and track my invoices,
so nothing falls through the cracks.

#### Acceptance Criteria

1. WHEN I add an invoice, THE SYSTEM SHALL require a client, an amount
   greater than zero, and a due date.
2. WHEN I view invoices, THE SYSTEM SHALL show status (sent, overdue, paid),
   amount, due date, and days overdue where applicable.
3. WHEN an invoice's due date passes unpaid, THE SYSTEM SHALL mark it overdue.
4. WHEN I import a CSV, THE SYSTEM SHALL create invoices from its rows and
   report how many were imported and how many failed (with reasons).

### Requirement 3 — Clients

**User Story:** As a tradesperson, I want my customers' contact details in
one place, so reminders reach the right person.

#### Acceptance Criteria

1. WHEN I add a client, THE SYSTEM SHALL store a name and at least one
   contact channel (email or phone).
2. WHEN I view a client, THE SYSTEM SHALL show their invoices and total
   outstanding balance.

### Requirement 4 — Reminder engine

**User Story:** As a tradesperson, I want overdue invoices chased
automatically, so I get paid without spending my evenings on the phone.

#### Acceptance Criteria

1. WHEN an invoice becomes 1 day overdue, THE SYSTEM SHALL queue the first
   reminder (friendly email).
2. WHEN an invoice reaches 7 days overdue, THE SYSTEM SHALL queue the second
   reminder (friendly SMS).
3. WHEN an invoice reaches 14 days overdue, THE SYSTEM SHALL queue the third
   reminder (firm email).
4. WHEN an invoice reaches 30 days overdue, THE SYSTEM SHALL queue the fourth
   reminder (firm SMS) and flag the invoice for personal follow-up.
5. WHEN a reminder is sent, THE SYSTEM SHALL log it with timestamp, channel,
   template used, and invoice.
6. WHEN an invoice is paid, THE SYSTEM SHALL stop all further reminders for it.
7. WHEN no contact channel exists for a reminder, THE SYSTEM SHALL skip that
   reminder and note the missing channel on the invoice.

### Requirement 5 — Templates

**User Story:** As a tradesperson, I want the reminders to sound like me,
so my customers are nudged, not offended.

#### Acceptance Criteria

1. WHEN I view templates, THE SYSTEM SHALL show one editable template per
   reminder step and channel.
2. WHEN I edit a template, THE SYSTEM SHALL support placeholders for client
   name, invoice number, amount, and due date.
3. WHEN a reminder is sent, THE SYSTEM SHALL render the template with the
   invoice's real values.

### Requirement 6 — Payments

**User Story:** As a tradesperson, I want to record payments easily, so the
dashboard always reflects reality.

#### Acceptance Criteria

1. WHEN I record a payment, THE SYSTEM SHALL accept full or partial amounts
   and update the invoice balance.
2. WHEN an invoice balance reaches zero, THE SYSTEM SHALL mark it paid and
   stop reminders.
3. WHEN I view an invoice, THE SYSTEM SHALL show its payment history.

### Requirement 7 — Demo mode

**User Story:** As a judge, I want to test every feature without accounts or
API keys, so I can evaluate the app in minutes.

#### Acceptance Criteria

1. WHEN the app starts with no configuration, THE SYSTEM SHALL load fictional
   demo data (clients, invoices, reminders) clearly labelled DEMO.
2. WHEN a reminder is triggered in demo mode, THE SYSTEM SHALL simulate the
   send and log it visibly, without calling any real service.
3. WHEN the app runs, THE SYSTEM SHALL require no login, no API key, and no
   paid service.
