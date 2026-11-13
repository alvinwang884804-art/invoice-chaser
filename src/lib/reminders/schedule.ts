/**
 * Reminder scheduling — pure functions over (invoice, today).
 * No I/O here; all database calls happen in the caller.
 *
 * Steps: 1 day overdue → friendly email
 *         7 days overdue → friendly SMS
 *        14 days overdue → firm email
 *        30 days overdue → firm SMS + flag for personal follow-up
 */

export const REMINDER_STEPS = [
  { step: 1, channel: "email" as const },
  { step: 7, channel: "sms" as const },
  { step: 14, channel: "email" as const },
  { step: 30, channel: "sms" as const },
] as const;

export type ReminderStep = { step: 1 | 7 | 14 | 30; channel: "email" | "sms" };

/**
 * Calculate calendar days between dueDate and today.
 * Returns a positive number if overdue, 0 if due today, negative if future.
 * Due date itself is NOT overdue (day 0).
 */
export function calendarDaysOverdue(dueDate: string, today: Date): number {
  // Parse YYYY-MM-DD and normalize both sides to UTC midnight so DST
  // transitions (which shorten or lengthen a local day) cannot affect
  // the millisecond difference.
  const [year, month, day] = dueDate.split("-").map(Number);
  const dueUtc = Date.UTC(year, month - 1, day);
  const todayUtc = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const diffMs = todayUtc - dueUtc;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export interface InvoiceForSchedule {
  id: string;
  status: "sent" | "overdue" | "paid";
  dueDate: string;
  clientEmail: string | null;
  clientPhone: string | null;
}

export interface SentReminder {
  step: number;
  channel: "email" | "sms";
}

/**
 * Returns the reminder steps that are due for an invoice today and
 * have not already been sent.
 *
 * Paid invoices never get reminders.
 * Missing contact channels are skipped — the caller logs the skip.
 */
export function dueReminders(
  invoice: InvoiceForSchedule,
  today: Date,
  alreadySent: SentReminder[]
): Array<ReminderStep & { skipReason?: string }> {
  if (invoice.status === "paid") return [];

  const daysOverdue = calendarDaysOverdue(invoice.dueDate, today);
  if (daysOverdue <= 0) return [];

  const result: Array<ReminderStep & { skipReason?: string }> = [];

  for (const { step, channel } of REMINDER_STEPS) {
    if (daysOverdue < step) continue; // threshold not reached yet

    // Already sent this step+channel pair
    const alreadyDone = alreadySent.some(
      (s) => s.step === step && s.channel === channel
    );
    if (alreadyDone) continue;

    // Check contact availability
    if (channel === "email" && !invoice.clientEmail) {
      result.push({ step, channel, skipReason: "no email address on file" });
      continue;
    }
    if (channel === "sms" && !invoice.clientPhone) {
      result.push({ step, channel, skipReason: "no phone number on file" });
      continue;
    }

    result.push({ step, channel });
  }

  return result;
}

/**
 * Returns true if the invoice is at exactly a reminder threshold day,
 * useful for showing "needs attention" flags.
 */
export function isAtThreshold(daysOverdue: number): boolean {
  return REMINDER_STEPS.some((s) => daysOverdue >= s.step);
}

/** Step 30 means flag for personal follow-up */
export function needsPersonalFollowUp(daysOverdue: number): boolean {
  return daysOverdue >= 30;
}
