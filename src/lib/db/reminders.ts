import { getDb } from "./index";
import { Reminder, ReminderWithDetails } from "./schema";
import { newId } from "../ids";

export function getAllReminders(): ReminderWithDetails[] {
  return getDb()
    .prepare(
      `SELECT r.*, i.number as invoiceNumber, c.name as clientName
       FROM Reminder r
       JOIN Invoice i ON i.id = r.invoiceId
       JOIN Client c ON c.id = i.clientId
       ORDER BY r.sentAt DESC`
    )
    .all() as ReminderWithDetails[];
}

export function getRemindersByInvoice(invoiceId: string): Reminder[] {
  return getDb()
    .prepare(
      "SELECT * FROM Reminder WHERE invoiceId=? ORDER BY sentAt ASC"
    )
    .all(invoiceId) as Reminder[];
}

export function hasReminder(
  invoiceId: string,
  step: number,
  channel: string
): boolean {
  const row = getDb()
    .prepare(
      "SELECT id FROM Reminder WHERE invoiceId=? AND step=? AND channel=?"
    )
    .get(invoiceId, step, channel);
  return row !== undefined;
}

export function logReminder(data: Omit<Reminder, "id" | "sentAt">): Reminder {
  const id = newId();
  const sentAt = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO Reminder (id, invoiceId, step, channel, templateId, sentAt, status, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      data.invoiceId,
      data.step,
      data.channel,
      data.templateId,
      sentAt,
      data.status,
      data.note ?? null
    );
  return getDb()
    .prepare("SELECT * FROM Reminder WHERE id=?")
    .get(id) as Reminder;
}
