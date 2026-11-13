import { getDb } from "./index";
import { Payment } from "./schema";
import { newId } from "../ids";

export function getPaymentsByInvoice(invoiceId: string): Payment[] {
  return getDb()
    .prepare(
      "SELECT * FROM Payment WHERE invoiceId = ? ORDER BY paidAt ASC"
    )
    .all(invoiceId) as Payment[];
}

export function getTotalPaidCents(invoiceId: string): number {
  const row = getDb()
    .prepare(
      "SELECT COALESCE(SUM(amountCents), 0) as total FROM Payment WHERE invoiceId = ?"
    )
    .get(invoiceId) as { total: number };
  return row.total;
}

export function recordPayment(
  data: Omit<Payment, "id" | "paidAt">
): Payment {
  const id = newId();
  const paidAt = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO Payment (id, invoiceId, amountCents, method, paidAt)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(id, data.invoiceId, data.amountCents, data.method ?? null, paidAt);

  // Check if invoice is now fully paid and update status
  const invoice = getDb()
    .prepare("SELECT amountCents FROM Invoice WHERE id = ?")
    .get(data.invoiceId) as { amountCents: number } | undefined;
  if (invoice) {
    const totalPaid = getTotalPaidCents(data.invoiceId);
    if (totalPaid >= invoice.amountCents) {
      getDb()
        .prepare("UPDATE Invoice SET status='paid' WHERE id=?")
        .run(data.invoiceId);
    }
  }

  return getDb()
    .prepare("SELECT * FROM Payment WHERE id=?")
    .get(id) as Payment;
}
