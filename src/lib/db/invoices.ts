import { getDb } from "./index";
import { Invoice, InvoiceWithClient } from "./schema";
import { newId } from "../ids";
import { calendarDaysOverdue } from "../reminders/schedule";

/** Derive status from due date and paid balance. */
export function deriveStatus(
  dueDate: string,
  amountCents: number,
  paidCents: number,
  today: Date = new Date()
): Invoice["status"] {
  if (paidCents >= amountCents) return "paid";
  const days = calendarDaysOverdue(dueDate, today);
  return days > 0 ? "overdue" : "sent";
}

/** Refresh status for all unpaid invoices (called on each API request / reminder run). */
export function refreshInvoiceStatuses(today: Date = new Date()): void {
  const db = getDb();
  const unpaid = db
    .prepare(
      `SELECT i.id, i.amountCents, i.dueDate,
              COALESCE(SUM(p.amountCents),0) as paidCents
       FROM Invoice i
       LEFT JOIN Payment p ON p.invoiceId = i.id
       WHERE i.status != 'paid'
       GROUP BY i.id`
    )
    .all() as Array<{
    id: string;
    amountCents: number;
    dueDate: string;
    paidCents: number;
  }>;

  const update = db.prepare("UPDATE Invoice SET status=? WHERE id=?");
  const txn = db.transaction(() => {
    for (const row of unpaid) {
      const status = deriveStatus(row.dueDate, row.amountCents, row.paidCents, today);
      update.run(status, row.id);
    }
  });
  txn();
}

export function getAllInvoices(): InvoiceWithClient[] {
  refreshInvoiceStatuses();
  return getDb()
    .prepare(
      `SELECT i.*, c.name as clientName
       FROM Invoice i
       JOIN Client c ON c.id = i.clientId
       ORDER BY i.dueDate ASC`
    )
    .all() as InvoiceWithClient[];
}

export function getInvoiceById(id: string): InvoiceWithClient | null {
  refreshInvoiceStatuses();
  return (
    (getDb()
      .prepare(
        `SELECT i.*, c.name as clientName
         FROM Invoice i
         JOIN Client c ON c.id = i.clientId
         WHERE i.id = ?`
      )
      .get(id) as InvoiceWithClient) ?? null
  );
}

export function getInvoicesByClient(clientId: string): InvoiceWithClient[] {
  refreshInvoiceStatuses();
  return getDb()
    .prepare(
      `SELECT i.*, c.name as clientName
       FROM Invoice i
       JOIN Client c ON c.id = i.clientId
       WHERE i.clientId = ?
       ORDER BY i.dueDate ASC`
    )
    .all(clientId) as InvoiceWithClient[];
}

export function createInvoice(
  data: Omit<Invoice, "id" | "createdAt" | "status">
): Invoice {
  const id = newId();
  const now = new Date().toISOString();
  const status = deriveStatus(data.dueDate, data.amountCents, 0);
  getDb()
    .prepare(
      `INSERT INTO Invoice (id, clientId, number, amountCents, dueDate, status, paymentLink, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      data.clientId,
      data.number,
      data.amountCents,
      data.dueDate,
      status,
      data.paymentLink ?? null,
      now
    );
  return getInvoiceById(id)!;
}

export function updateInvoice(
  id: string,
  data: Partial<Omit<Invoice, "id" | "createdAt">>
): Invoice | null {
  const invoice = getInvoiceById(id);
  if (!invoice) return null;
  const updated = { ...invoice, ...data };
  getDb()
    .prepare(
      `UPDATE Invoice SET clientId=?, number=?, amountCents=?, dueDate=?, status=?, paymentLink=? WHERE id=?`
    )
    .run(
      updated.clientId,
      updated.number,
      updated.amountCents,
      updated.dueDate,
      updated.status,
      updated.paymentLink ?? null,
      id
    );
  return getInvoiceById(id)!;
}

export function deleteInvoice(id: string): boolean {
  const result = getDb()
    .prepare("DELETE FROM Invoice WHERE id = ?")
    .run(id);
  return result.changes > 0;
}

/** Dashboard KPIs */
export function getDashboardStats(today: Date = new Date()): {
  totalOutstandingCents: number;
  totalOverdueCents: number;
  recoveredThisMonthCents: number;
  overdueCount: number;
} {
  refreshInvoiceStatuses(today);
  const db = getDb();

  const outstanding = db
    .prepare(
      `SELECT COALESCE(SUM(i.amountCents) - SUM(COALESCE(p.amountCents,0)), 0) as val
       FROM Invoice i
       LEFT JOIN Payment p ON p.invoiceId = i.id
       WHERE i.status != 'paid'`
    )
    .get() as { val: number };

  const overdue = db
    .prepare(
      `SELECT
         COUNT(*) as cnt,
         COALESCE(SUM(i.amountCents) - SUM(COALESCE(p.amountCents,0)), 0) as val
       FROM Invoice i
       LEFT JOIN Payment p ON p.invoiceId = i.id
       WHERE i.status = 'overdue'`
    )
    .get() as { cnt: number; val: number };

  // Payments recorded this calendar month
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const recovered = db
    .prepare(
      `SELECT COALESCE(SUM(amountCents),0) as val
       FROM Payment
       WHERE paidAt >= ?`
    )
    .get(monthStart) as { val: number };

  return {
    totalOutstandingCents: outstanding.val,
    totalOverdueCents: overdue.val,
    recoveredThisMonthCents: recovered.val,
    overdueCount: overdue.cnt,
  };
}

/** Top N most overdue invoices (by days overdue, descending). */
export function getMostOverdue(limit = 5, today: Date = new Date()): Array<
  InvoiceWithClient & { paidCents: number; balanceCents: number; daysOverdue: number }
> {
  refreshInvoiceStatuses(today);
  const rows = getDb()
    .prepare(
      `SELECT i.*, c.name as clientName,
              COALESCE(SUM(p.amountCents),0) as paidCents
       FROM Invoice i
       JOIN Client c ON c.id = i.clientId
       LEFT JOIN Payment p ON p.invoiceId = i.id
       WHERE i.status = 'overdue'
       GROUP BY i.id
       ORDER BY i.dueDate ASC
       LIMIT ?`
    )
    .all(limit) as Array<InvoiceWithClient & { paidCents: number }>;

  return rows.map((r) => ({
    ...r,
    balanceCents: r.amountCents - r.paidCents,
    daysOverdue: calendarDaysOverdue(r.dueDate, today),
  }));
}

/** Recent activity — last N reminders sent. */
export function getRecentActivity(limit = 10): Array<{
  id: string;
  invoiceNumber: string;
  clientName: string;
  step: number;
  channel: string;
  status: string;
  sentAt: string;
}> {
  return getDb()
    .prepare(
      `SELECT r.id, i.number as invoiceNumber, c.name as clientName,
              r.step, r.channel, r.status, r.sentAt
       FROM Reminder r
       JOIN Invoice i ON i.id = r.invoiceId
       JOIN Client c ON c.id = i.clientId
       ORDER BY r.sentAt DESC
       LIMIT ?`
    )
    .all(limit) as Array<{
    id: string;
    invoiceNumber: string;
    clientName: string;
    step: number;
    channel: string;
    status: string;
    sentAt: string;
  }>;
}
