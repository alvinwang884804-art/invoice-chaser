import { getDb } from "./index";
import { Template } from "./schema";
import { newId } from "../ids";

/** Default reminder templates — friendly to firm tone ladder. */
export const DEFAULT_TEMPLATES: Omit<Template, "id">[] = [
  {
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
    step: 7,
    channel: "sms",
    subject: null,
    body: `Hi {{clientName}}, this is a reminder that Invoice {{invoiceNumber}} ({{amount}}) is now 7 days overdue. Pay here: {{paymentLink}}`,
  },
  {
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
    step: 30,
    channel: "sms",
    subject: null,
    body: `IMPORTANT: Invoice {{invoiceNumber}} ({{amount}}) is now 30 days overdue. Please pay urgently: {{paymentLink}} or call us to discuss.`,
  },
];

export function getAllTemplates(): Template[] {
  return getDb()
    .prepare("SELECT * FROM Template ORDER BY step ASC, channel ASC")
    .all() as Template[];
}

export function getTemplateById(id: string): Template | null {
  return (
    (getDb()
      .prepare("SELECT * FROM Template WHERE id=?")
      .get(id) as Template) ?? null
  );
}

export function getTemplateByStepAndChannel(
  step: number,
  channel: string
): Template | null {
  return (
    (getDb()
      .prepare("SELECT * FROM Template WHERE step=? AND channel=?")
      .get(step, channel) as Template) ?? null
  );
}

export function upsertDefaultTemplates(): void {
  const existing = getAllTemplates();
  if (existing.length > 0) return; // already seeded

  const insert = getDb().prepare(
    `INSERT INTO Template (id, step, channel, subject, body) VALUES (?, ?, ?, ?, ?)`
  );
  const txn = getDb().transaction(() => {
    for (const t of DEFAULT_TEMPLATES) {
      insert.run(newId(), t.step, t.channel, t.subject ?? null, t.body);
    }
  });
  txn();
}

export function updateTemplate(
  id: string,
  data: Pick<Template, "subject" | "body">
): Template | null {
  const existing = getTemplateById(id);
  if (!existing) return null;
  getDb()
    .prepare("UPDATE Template SET subject=?, body=? WHERE id=?")
    .run(data.subject ?? null, data.body, id);
  return getTemplateById(id)!;
}
