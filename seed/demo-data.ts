/**
 * DEMO seed data — fictional clients, invoices, reminders.
 * All data is clearly fictional. Never use real customer information.
 * Run: npm run db:seed
 */

import Database from "better-sqlite3";
import path from "path";
import { existsSync, mkdirSync } from "fs";
import { randomUUID } from "crypto";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "invoice-chaser.db");

if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS Client (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    notes TEXT,
    createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
  );
  CREATE TABLE IF NOT EXISTS Invoice (
    id TEXT PRIMARY KEY,
    clientId TEXT NOT NULL REFERENCES Client(id),
    number TEXT NOT NULL,
    amountCents INTEGER NOT NULL CHECK(amountCents > 0),
    dueDate TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent' CHECK(status IN ('sent','overdue','paid')),
    paymentLink TEXT,
    createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
  );
  CREATE TABLE IF NOT EXISTS Payment (
    id TEXT PRIMARY KEY,
    invoiceId TEXT NOT NULL REFERENCES Invoice(id),
    amountCents INTEGER NOT NULL CHECK(amountCents > 0),
    method TEXT CHECK(method IN ('cash','card','e-transfer','other')),
    paidAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
  );
  CREATE TABLE IF NOT EXISTS Template (
    id TEXT PRIMARY KEY,
    step INTEGER NOT NULL CHECK(step IN (1,7,14,30)),
    channel TEXT NOT NULL CHECK(channel IN ('email','sms')),
    subject TEXT,
    body TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS Reminder (
    id TEXT PRIMARY KEY,
    invoiceId TEXT NOT NULL REFERENCES Invoice(id),
    step INTEGER NOT NULL CHECK(step IN (1,7,14,30)),
    channel TEXT NOT NULL CHECK(channel IN ('email','sms')),
    templateId TEXT NOT NULL REFERENCES Template(id),
    sentAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
    status TEXT NOT NULL CHECK(status IN ('sent','skipped','failed')),
    note TEXT
  );
`);

// Clear existing data for a clean seed
db.exec(`
  DELETE FROM Reminder;
  DELETE FROM Payment;
  DELETE FROM Invoice;
  DELETE FROM Client;
  DELETE FROM Template;
`);

// ─── Templates ───────────────────────────────────────────────────────────────

const templates = [
  {
    id: randomUUID(),
    step: 1,
    channel: "email",
    subject: "Quick reminder — Invoice {{invoiceNumber}}",
    body: `Hi {{clientName}},

Just a friendly nudge — Invoice {{invoiceNumber}} for {{amount}} was due on {{dueDate}}.

If you've already sent payment, please ignore this message. If not, you can pay here: {{paymentLink}}

Thanks so much for your business.

— The team`,
  },
  {
    id: randomUUID(),
    step: 7,
    channel: "sms",
    subject: null,
    body: `Hi {{clientName}}, this is a reminder that Invoice {{invoiceNumber}} ({{amount}}) is now 7 days overdue. Pay here: {{paymentLink}}`,
  },
  {
    id: randomUUID(),
    step: 14,
    channel: "email",
    subject: "Second notice — Invoice {{invoiceNumber}} is overdue",
    body: `Hi {{clientName}},

This is a second notice for Invoice {{invoiceNumber}} totalling {{amount}}, which was due on {{dueDate}}.

We kindly ask that you arrange payment as soon as possible. If there's an issue, please get in touch.

Pay online: {{paymentLink}}

Thank you,
— The team`,
  },
  {
    id: randomUUID(),
    step: 30,
    channel: "sms",
    subject: null,
    body: `IMPORTANT: Invoice {{invoiceNumber}} ({{amount}}) is now 30 days overdue. Please pay urgently: {{paymentLink}} or call us to discuss.`,
  },
];

const insertTemplate = db.prepare(
  `INSERT INTO Template (id, step, channel, subject, body) VALUES (?, ?, ?, ?, ?)`
);
for (const t of templates) {
  insertTemplate.run(t.id, t.step, t.channel, t.subject, t.body);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const today = new Date();
const ago = (days: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
};
const future = (days: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

// ─── Clients (all fictional — DEMO data) — 8 clients ─────────────────────────

const clients = [
  // 0 — has both email and phone
  {
    id: randomUUID(),
    name: "DEMO — Sandra Whitmore",
    email: "sandra.whitmore@example.com",
    phone: "+15550101234",
    notes: "Residential customer, Oakwood Heights",
  },
  // 1 — has both email and phone
  {
    id: randomUUID(),
    name: "DEMO — Riverside Property Group",
    email: "accounts@riversidepg.example.com",
    phone: "+15550105678",
    notes: "Commercial — 4 units managed by Frank Avery",
  },
  // 2 — PHONE ONLY (no email)
  {
    id: randomUUID(),
    name: "DEMO — Dale & Maria Kowalski",
    email: null,
    phone: "+15550109012",
    notes: "Phone only — no email on file",
  },
  // 3 — EMAIL ONLY (no phone)
  {
    id: randomUUID(),
    name: "DEMO — Greenview Rentals LLC",
    email: "billing@greenviewrentals.example.com",
    phone: null,
    notes: "Email only — accounts payable dept",
  },
  // 4 — has both email and phone
  {
    id: randomUUID(),
    name: "DEMO — Tom Nguyen",
    email: "tom.nguyen@example.com",
    phone: "+15550103456",
    notes: "New customer, referral from Sandra",
  },
  // 5 — has both email and phone
  {
    id: randomUUID(),
    name: "DEMO — Brightfield Construction Co.",
    email: "invoices@brightfieldco.example.com",
    phone: "+15550107890",
    notes: "Commercial contractor — net-30 terms",
  },
  // 6 — has both email and phone
  {
    id: randomUUID(),
    name: "DEMO — Priya Nambiar",
    email: "priya.nambiar@example.com",
    phone: "+15550102468",
    notes: "Residential — kitchen renovation follow-up",
  },
  // 7 — has both email and phone
  {
    id: randomUUID(),
    name: "DEMO — Lakeview HOA",
    email: "manager@lakeviewhoa.example.com",
    phone: "+15550108765",
    notes: "Homeowners association — annual maintenance contract",
  },
];

const insertClient = db.prepare(
  `INSERT INTO Client (id, name, email, phone, notes) VALUES (?, ?, ?, ?, ?)`
);
for (const c of clients) {
  insertClient.run(c.id, c.name, c.email, c.phone, c.notes);
}

// ─── Invoices — 12 invoices ───────────────────────────────────────────────────

const invoices = [
  // 0 — 35 days overdue — Sandra Whitmore (most overdue, needs personal follow-up)
  {
    id: randomUUID(),
    clientId: clients[0].id,
    number: "INV-1001",
    amountCents: 189500, // $1,895.00
    dueDate: ago(35),
    status: "overdue",
    paymentLink: "https://pay.example.com/inv-1001",
  },
  // 1 — 22 days overdue — Riverside Property Group
  {
    id: randomUUID(),
    clientId: clients[1].id,
    number: "INV-1002",
    amountCents: 425000, // $4,250.00
    dueDate: ago(22),
    status: "overdue",
    paymentLink: "https://pay.example.com/inv-1002",
  },
  // 2 — 10 days overdue — Kowalski (phone only)
  {
    id: randomUUID(),
    clientId: clients[2].id,
    number: "INV-1003",
    amountCents: 73500, // $735.00
    dueDate: ago(10),
    status: "overdue",
    paymentLink: "https://pay.example.com/inv-1003",
  },
  // 3 — 3 days overdue — Greenview Rentals (email only)
  {
    id: randomUUID(),
    clientId: clients[3].id,
    number: "INV-1004",
    amountCents: 118000, // $1,180.00
    dueDate: ago(3),
    status: "overdue",
    paymentLink: "https://pay.example.com/inv-1004",
  },
  // 4 — 15 days overdue — Tom Nguyen (partially paid)
  {
    id: randomUUID(),
    clientId: clients[4].id,
    number: "INV-1005",
    amountCents: 96000, // $960.00
    dueDate: ago(15),
    status: "overdue",
    paymentLink: "https://pay.example.com/inv-1005",
  },
  // 5 — Not yet due — Sandra Whitmore
  {
    id: randomUUID(),
    clientId: clients[0].id,
    number: "INV-1006",
    amountCents: 54000, // $540.00
    dueDate: future(14),
    status: "sent",
    paymentLink: "https://pay.example.com/inv-1006",
  },
  // 6 — Paid — Riverside Property Group
  {
    id: randomUUID(),
    clientId: clients[1].id,
    number: "INV-1007",
    amountCents: 310000, // $3,100.00
    dueDate: ago(45),
    status: "paid",
    paymentLink: "https://pay.example.com/inv-1007",
  },
  // 7 — Paid — Tom Nguyen (older)
  {
    id: randomUUID(),
    clientId: clients[4].id,
    number: "INV-1008",
    amountCents: 48500, // $485.00
    dueDate: ago(60),
    status: "paid",
    paymentLink: "https://pay.example.com/inv-1008",
  },
  // 8 — 8 days overdue — Brightfield Construction Co.
  {
    id: randomUUID(),
    clientId: clients[5].id,
    number: "INV-1009",
    amountCents: 520000, // $5,200.00
    dueDate: ago(8),
    status: "overdue",
    paymentLink: "https://pay.example.com/inv-1009",
  },
  // 9 — Not yet due — Priya Nambiar
  {
    id: randomUUID(),
    clientId: clients[6].id,
    number: "INV-1010",
    amountCents: 87500, // $875.00
    dueDate: future(7),
    status: "sent",
    paymentLink: "https://pay.example.com/inv-1010",
  },
  // 10 — Paid — Lakeview HOA (recent, paid on time)
  {
    id: randomUUID(),
    clientId: clients[7].id,
    number: "INV-1011",
    amountCents: 145000, // $1,450.00
    dueDate: ago(20),
    status: "paid",
    paymentLink: "https://pay.example.com/inv-1011",
  },
  // 11 — 2 days overdue — Priya Nambiar (just tipped over)
  {
    id: randomUUID(),
    clientId: clients[6].id,
    number: "INV-1012",
    amountCents: 62000, // $620.00
    dueDate: ago(2),
    status: "overdue",
    paymentLink: "https://pay.example.com/inv-1012",
  },
];

const insertInvoice = db.prepare(
  `INSERT INTO Invoice (id, clientId, number, amountCents, dueDate, status, paymentLink) VALUES (?, ?, ?, ?, ?, ?, ?)`
);
for (const inv of invoices) {
  insertInvoice.run(
    inv.id,
    inv.clientId,
    inv.number,
    inv.amountCents,
    inv.dueDate,
    inv.status,
    inv.paymentLink
  );
}

// ─── Payments ─────────────────────────────────────────────────────────────────

const payments = [
  // INV-1007 (Riverside, paid in full)
  {
    id: randomUUID(),
    invoiceId: invoices[6].id,
    amountCents: 310000,
    method: "e-transfer",
    paidAt: `${ago(40)}T10:00:00Z`,
  },
  // INV-1008 (Tom, paid in full)
  {
    id: randomUUID(),
    invoiceId: invoices[7].id,
    amountCents: 48500,
    method: "card",
    paidAt: `${ago(55)}T14:30:00Z`,
  },
  // INV-1005 (Tom, PARTIAL — $400 paid of $960)
  {
    id: randomUUID(),
    invoiceId: invoices[4].id,
    amountCents: 40000,
    method: "cash",
    paidAt: `${ago(5)}T09:00:00Z`,
  },
  // INV-1011 (Lakeview HOA, paid in full)
  {
    id: randomUUID(),
    invoiceId: invoices[10].id,
    amountCents: 145000,
    method: "e-transfer",
    paidAt: `${ago(15)}T11:00:00Z`,
  },
];

const insertPayment = db.prepare(
  `INSERT INTO Payment (id, invoiceId, amountCents, method, paidAt) VALUES (?, ?, ?, ?, ?)`
);
for (const p of payments) {
  insertPayment.run(p.id, p.invoiceId, p.amountCents, p.method, p.paidAt);
}

// ─── Reminder history ─────────────────────────────────────────────────────────

const reminderHistory = [
  // INV-1001 (Sandra, 35 days overdue) — all 4 steps sent
  {
    id: randomUUID(),
    invoiceId: invoices[0].id,
    step: 1,
    channel: "email",
    templateId: templates[0].id,
    sentAt: `${ago(34)}T08:00:00Z`,
    status: "sent",
    note: "demo-email-auto",
  },
  {
    id: randomUUID(),
    invoiceId: invoices[0].id,
    step: 7,
    channel: "sms",
    templateId: templates[1].id,
    sentAt: `${ago(28)}T08:00:00Z`,
    status: "sent",
    note: "demo-sms-auto",
  },
  {
    id: randomUUID(),
    invoiceId: invoices[0].id,
    step: 14,
    channel: "email",
    templateId: templates[2].id,
    sentAt: `${ago(21)}T08:00:00Z`,
    status: "sent",
    note: "demo-email-auto",
  },
  {
    id: randomUUID(),
    invoiceId: invoices[0].id,
    step: 30,
    channel: "sms",
    templateId: templates[3].id,
    sentAt: `${ago(5)}T08:00:00Z`,
    status: "sent",
    note: "demo-sms-auto — flagged for personal follow-up",
  },
  // INV-1002 (Riverside, 22 days overdue) — steps 1, 7, 14 sent
  {
    id: randomUUID(),
    invoiceId: invoices[1].id,
    step: 1,
    channel: "email",
    templateId: templates[0].id,
    sentAt: `${ago(21)}T08:00:00Z`,
    status: "sent",
    note: "demo-email-auto",
  },
  {
    id: randomUUID(),
    invoiceId: invoices[1].id,
    step: 7,
    channel: "sms",
    templateId: templates[1].id,
    sentAt: `${ago(15)}T08:00:00Z`,
    status: "sent",
    note: "demo-sms-auto",
  },
  {
    id: randomUUID(),
    invoiceId: invoices[1].id,
    step: 14,
    channel: "email",
    templateId: templates[2].id,
    sentAt: `${ago(8)}T08:00:00Z`,
    status: "sent",
    note: "demo-email-auto",
  },
  // INV-1003 (Kowalski, 10 days overdue, phone only) — email skipped, SMS step 7 sent
  {
    id: randomUUID(),
    invoiceId: invoices[2].id,
    step: 1,
    channel: "email",
    templateId: templates[0].id,
    sentAt: `${ago(9)}T08:00:00Z`,
    status: "skipped",
    note: "no email address on file",
  },
  {
    id: randomUUID(),
    invoiceId: invoices[2].id,
    step: 7,
    channel: "sms",
    templateId: templates[1].id,
    sentAt: `${ago(3)}T08:00:00Z`,
    status: "sent",
    note: "demo-sms-auto",
  },
  // INV-1004 (Greenview, 3 days overdue, email only) — step 1 sent
  {
    id: randomUUID(),
    invoiceId: invoices[3].id,
    step: 1,
    channel: "email",
    templateId: templates[0].id,
    sentAt: `${ago(2)}T08:00:00Z`,
    status: "sent",
    note: "demo-email-auto",
  },
  // INV-1005 (Tom, 15 days overdue) — steps 1, 7, 14 sent
  {
    id: randomUUID(),
    invoiceId: invoices[4].id,
    step: 1,
    channel: "email",
    templateId: templates[0].id,
    sentAt: `${ago(14)}T08:00:00Z`,
    status: "sent",
    note: "demo-email-auto",
  },
  {
    id: randomUUID(),
    invoiceId: invoices[4].id,
    step: 7,
    channel: "sms",
    templateId: templates[1].id,
    sentAt: `${ago(8)}T08:00:00Z`,
    status: "sent",
    note: "demo-sms-auto",
  },
  {
    id: randomUUID(),
    invoiceId: invoices[4].id,
    step: 14,
    channel: "email",
    templateId: templates[2].id,
    sentAt: `${ago(1)}T08:00:00Z`,
    status: "sent",
    note: "demo-email-auto",
  },
  // INV-1009 (Brightfield, 8 days overdue) — steps 1 and 7 sent
  {
    id: randomUUID(),
    invoiceId: invoices[8].id,
    step: 1,
    channel: "email",
    templateId: templates[0].id,
    sentAt: `${ago(7)}T08:00:00Z`,
    status: "sent",
    note: "demo-email-auto",
  },
  {
    id: randomUUID(),
    invoiceId: invoices[8].id,
    step: 7,
    channel: "sms",
    templateId: templates[1].id,
    sentAt: `${ago(1)}T08:00:00Z`,
    status: "sent",
    note: "demo-sms-auto",
  },
  // INV-1012 (Priya, 2 days overdue) — step 1 sent
  {
    id: randomUUID(),
    invoiceId: invoices[11].id,
    step: 1,
    channel: "email",
    templateId: templates[0].id,
    sentAt: `${ago(1)}T08:00:00Z`,
    status: "sent",
    note: "demo-email-auto",
  },
];

const insertReminder = db.prepare(
  `INSERT INTO Reminder (id, invoiceId, step, channel, templateId, sentAt, status, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
);
for (const r of reminderHistory) {
  insertReminder.run(
    r.id,
    r.invoiceId,
    r.step,
    r.channel,
    r.templateId,
    r.sentAt,
    r.status,
    r.note
  );
}

console.log("✅ DEMO data seeded:");
console.log(`   ${clients.length} clients (all fictional — DEMO)`);
console.log(`   ${invoices.length} invoices`);
console.log(`   ${payments.length} payments`);
console.log(`   ${reminderHistory.length} reminder log entries`);
console.log(`   ${templates.length} reminder templates`);
console.log("");
console.log("   Database:", DB_PATH);

db.close();
