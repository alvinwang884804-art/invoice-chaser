/**
 * TypeScript types mirroring the data model in prisma/schema.prisma.
 * All amounts are integer cents. All dates are stored as ISO-8601 strings (UTC).
 */

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: string; // ISO-8601
}

export interface Invoice {
  id: string;
  clientId: string;
  number: string;
  amountCents: number; // integer cents
  dueDate: string; // ISO-8601 date string (YYYY-MM-DD)
  status: "sent" | "overdue" | "paid";
  paymentLink: string | null;
  createdAt: string; // ISO-8601
}

export type InvoiceWithClient = Invoice & { clientName: string };

export interface Payment {
  id: string;
  invoiceId: string;
  amountCents: number;
  method: "cash" | "card" | "e-transfer" | "other" | null;
  paidAt: string; // ISO-8601
}

export interface Reminder {
  id: string;
  invoiceId: string;
  step: 1 | 7 | 14 | 30;
  channel: "email" | "sms";
  templateId: string;
  sentAt: string; // ISO-8601
  status: "sent" | "skipped" | "failed";
  note: string | null;
}

export type ReminderWithDetails = Reminder & {
  invoiceNumber: string;
  clientName: string;
};

export interface Template {
  id: string;
  step: 1 | 7 | 14 | 30;
  channel: "email" | "sms";
  subject: string | null; // email only
  body: string; // {{clientName}} {{invoiceNumber}} {{amount}} {{dueDate}}
}
