/**
 * Tests for template rendering.
 */

import { describe, it, expect } from "vitest";
import { renderTemplate } from "@/lib/reminders/render";

const ctx = {
  clientName: "Sandra Whitmore",
  invoiceNumber: "INV-1001",
  amountCents: 189500,
  dueDate: "2024-05-15",
  paymentLink: "https://pay.example.com/inv-1001",
};

describe("renderTemplate", () => {
  it("replaces {{clientName}}", () => {
    const result = renderTemplate("Hi {{clientName}},", ctx);
    expect(result).toBe("Hi Sandra Whitmore,");
  });

  it("replaces {{invoiceNumber}}", () => {
    const result = renderTemplate("Invoice {{invoiceNumber}}", ctx);
    expect(result).toBe("Invoice INV-1001");
  });

  it("replaces {{amount}} as formatted USD", () => {
    const result = renderTemplate("Amount: {{amount}}", ctx);
    expect(result).toBe("Amount: $1,895.00");
  });

  it("replaces {{paymentLink}}", () => {
    const result = renderTemplate("Pay: {{paymentLink}}", ctx);
    expect(result).toBe("Pay: https://pay.example.com/inv-1001");
  });

  it("replaces {{dueDate}} as formatted date", () => {
    const result = renderTemplate("Due: {{dueDate}}", ctx);
    expect(result).toContain("May");
    expect(result).toContain("2024");
  });

  it("replaces all placeholders in a full template", () => {
    const template = "Hi {{clientName}}, invoice {{invoiceNumber}} for {{amount}} was due {{dueDate}}. Pay: {{paymentLink}}";
    const result = renderTemplate(template, ctx);
    expect(result).toContain("Sandra Whitmore");
    expect(result).toContain("INV-1001");
    expect(result).toContain("$1,895.00");
    expect(result).toContain("May");
    expect(result).toContain("https://pay.example.com/inv-1001");
    expect(result).not.toContain("{{");
    expect(result).not.toContain("}}");
  });

  it("handles multiple occurrences of the same placeholder", () => {
    const template = "{{clientName}} owes {{amount}}. Pay {{amount}} now, {{clientName}}.";
    const result = renderTemplate(template, ctx);
    expect(result).toBe(
      "Sandra Whitmore owes $1,895.00. Pay $1,895.00 now, Sandra Whitmore."
    );
  });
});
