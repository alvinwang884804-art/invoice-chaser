/**
 * Reminder runner — evaluates all unpaid invoices, sends due reminders,
 * and logs everything. Called manually ("Run reminders" button) or on a
 * daily schedule.
 *
 * Uses demo providers by default; real providers are drop-in replacements.
 */

import { getDb } from "../db/index";
import { getRemindersByInvoice, hasReminder, logReminder } from "../db/reminders";
import { getTemplateByStepAndChannel } from "../db/templates";
import { dueReminders } from "./schedule";
import { renderTemplate, RenderContext } from "./render";
import { demoEmail, demoSms } from "../providers/demo";
import type { EmailProvider, SmsProvider } from "../providers/types";

export interface RunResult {
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
  details: Array<{
    invoiceId: string;
    invoiceNumber: string;
    clientName: string;
    step: number;
    channel: string;
    status: "sent" | "skipped" | "failed";
    note?: string;
  }>;
}

export async function runReminders(
  today: Date = new Date(),
  emailProvider: EmailProvider = demoEmail,
  smsProvider: SmsProvider = demoSms
): Promise<RunResult> {
  const db = getDb();

  // Load all unpaid invoices with client contact info
  const invoices = db
    .prepare(
      `SELECT i.id, i.number, i.amountCents, i.dueDate, i.status, i.paymentLink,
              c.name as clientName, c.email as clientEmail, c.phone as clientPhone
       FROM Invoice i
       JOIN Client c ON c.id = i.clientId
       WHERE i.status != 'paid'`
    )
    .all() as Array<{
    id: string;
    number: string;
    amountCents: number;
    dueDate: string;
    status: "sent" | "overdue" | "paid";
    paymentLink: string | null;
    clientName: string;
    clientEmail: string | null;
    clientPhone: string | null;
  }>;

  const result: RunResult = {
    processed: invoices.length,
    sent: 0,
    skipped: 0,
    failed: 0,
    details: [],
  };

  for (const invoice of invoices) {
    // Get already-sent reminders for this invoice
    const sentReminders = getRemindersByInvoice(invoice.id).map((r) => ({
      step: r.step,
      channel: r.channel,
    }));

    const due = dueReminders(
      {
        id: invoice.id,
        status: invoice.status,
        dueDate: invoice.dueDate,
        clientEmail: invoice.clientEmail,
        clientPhone: invoice.clientPhone,
      },
      today,
      sentReminders
    );

    for (const dueStep of due) {
      const template = getTemplateByStepAndChannel(dueStep.step, dueStep.channel);

      // Skip if no template found (shouldn't happen with seeded defaults)
      if (!template) {
        const skipped = logReminder({
          invoiceId: invoice.id,
          step: dueStep.step as 1 | 7 | 14 | 30,
          channel: dueStep.channel,
          templateId: "unknown",
          status: "skipped",
          note: "No template found for this step/channel",
        });
        result.skipped++;
        result.details.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.number,
          clientName: invoice.clientName,
          step: dueStep.step,
          channel: dueStep.channel,
          status: "skipped",
          note: "No template found",
        });
        continue;
      }

      // Skip if missing contact channel
      if (dueStep.skipReason) {
        logReminder({
          invoiceId: invoice.id,
          step: dueStep.step as 1 | 7 | 14 | 30,
          channel: dueStep.channel,
          templateId: template.id,
          status: "skipped",
          note: dueStep.skipReason,
        });
        result.skipped++;
        result.details.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.number,
          clientName: invoice.clientName,
          step: dueStep.step,
          channel: dueStep.channel,
          status: "skipped",
          note: dueStep.skipReason,
        });
        continue;
      }

      // Render template
      const ctx: RenderContext = {
        clientName: invoice.clientName,
        invoiceNumber: invoice.number,
        amountCents: invoice.amountCents,
        dueDate: invoice.dueDate,
        paymentLink: invoice.paymentLink ?? "N/A",
      };
      const renderedBody = renderTemplate(template.body, ctx);
      const renderedSubject = template.subject
        ? renderTemplate(template.subject, ctx)
        : "";

      // Send via provider
      let sendResult;
      try {
        if (dueStep.channel === "email" && invoice.clientEmail) {
          sendResult = await emailProvider.send(
            invoice.clientEmail,
            renderedSubject,
            renderedBody
          );
        } else if (dueStep.channel === "sms" && invoice.clientPhone) {
          sendResult = await smsProvider.send(invoice.clientPhone, renderedBody);
        } else {
          sendResult = { ok: false, error: "No contact method" };
        }
      } catch (err) {
        sendResult = {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        };
      }

      if (sendResult.ok) {
        logReminder({
          invoiceId: invoice.id,
          step: dueStep.step as 1 | 7 | 14 | 30,
          channel: dueStep.channel,
          templateId: template.id,
          status: "sent",
          note: sendResult.messageId
            ? `messageId: ${sendResult.messageId}`
            : null,
        });
        result.sent++;
        result.details.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.number,
          clientName: invoice.clientName,
          step: dueStep.step,
          channel: dueStep.channel,
          status: "sent",
        });
      } else {
        logReminder({
          invoiceId: invoice.id,
          step: dueStep.step as 1 | 7 | 14 | 30,
          channel: dueStep.channel,
          templateId: template.id,
          status: "failed",
          note: sendResult.error ?? "Unknown error",
        });
        result.failed++;
        result.details.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.number,
          clientName: invoice.clientName,
          step: dueStep.step,
          channel: dueStep.channel,
          status: "failed",
          note: sendResult.error,
        });
      }
    }
  }

  return result;
}
