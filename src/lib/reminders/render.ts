/**
 * Template rendering — replace placeholders with real invoice values.
 * Supported placeholders: {{clientName}} {{invoiceNumber}} {{amount}} {{dueDate}} {{paymentLink}}
 */

import { formatCents } from "../money";

export interface RenderContext {
  clientName: string;
  invoiceNumber: string;
  amountCents: number;
  dueDate: string;
  paymentLink: string;
}

export function renderTemplate(template: string, ctx: RenderContext): string {
  return template
    .replace(/\{\{clientName\}\}/g, ctx.clientName)
    .replace(/\{\{invoiceNumber\}\}/g, ctx.invoiceNumber)
    .replace(/\{\{amount\}\}/g, formatCents(ctx.amountCents))
    .replace(/\{\{dueDate\}\}/g, formatDueDate(ctx.dueDate))
    .replace(/\{\{paymentLink\}\}/g, ctx.paymentLink);
}

function formatDueDate(dueDate: string): string {
  // dueDate is YYYY-MM-DD; display as "Month D, YYYY"
  const [year, month, day] = dueDate.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
