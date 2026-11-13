/**
 * Tests for the reminder scheduling engine.
 * Uses property-based tests for date arithmetic (fast-check).
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  calendarDaysOverdue,
  dueReminders,
  REMINDER_STEPS,
} from "@/lib/reminders/schedule";

// ─── calendarDaysOverdue ──────────────────────────────────────────────────────

describe("calendarDaysOverdue", () => {
  it("returns 0 when due today", () => {
    const today = new Date(2024, 5, 15); // June 15 2024
    expect(calendarDaysOverdue("2024-06-15", today)).toBe(0);
  });

  it("returns positive when past due", () => {
    const today = new Date(2024, 5, 20);
    expect(calendarDaysOverdue("2024-06-15", today)).toBe(5);
  });

  it("returns negative when future", () => {
    const today = new Date(2024, 5, 10);
    expect(calendarDaysOverdue("2024-06-15", today)).toBe(-5);
  });

  it("handles month boundary (May → June)", () => {
    const today = new Date(2024, 5, 3); // June 3
    expect(calendarDaysOverdue("2024-05-31", today)).toBe(3);
  });

  it("handles year boundary (Dec → Jan)", () => {
    const today = new Date(2025, 0, 2); // Jan 2 2025
    expect(calendarDaysOverdue("2024-12-31", today)).toBe(2);
  });

  it("handles leap year (Feb 29)", () => {
    // 2024 is a leap year
    const today = new Date(2024, 2, 1); // March 1 2024
    expect(calendarDaysOverdue("2024-02-29", today)).toBe(1);
  });

  it("handles exact 30 days overdue", () => {
    const today = new Date(2024, 5, 15); // June 15
    expect(calendarDaysOverdue("2024-05-16", today)).toBe(30);
  });

  // Property-based: days overdue is always an integer
  it("always returns an integer (property)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2000, max: 2099 }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 1, max: 28 }), // use 1-28 to avoid month-end issues
        fc.integer({ min: -365, max: 365 }),
        (year, month, day, offset) => {
          const dueDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const today = new Date(year, month - 1, day + offset);
          const result = calendarDaysOverdue(dueDate, today);
          expect(Number.isInteger(result)).toBe(true);
        }
      )
    );
  });

  // Property-based: symmetry — overdue by N means -N days until due
  it("is antisymmetric (property)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2020, max: 2030 }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 1, max: 28 }),
        fc.integer({ min: 1, max: 60 }),
        (year, month, day, offset) => {
          const dueDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const today = new Date(year, month - 1, day + offset);
          const yesterday = new Date(year, month - 1, day - offset);
          const fwd = calendarDaysOverdue(dueDate, today);
          const bwd = calendarDaysOverdue(dueDate, yesterday);
          expect(fwd).toBe(offset);
          expect(bwd).toBe(-offset);
        }
      )
    );
  });
});

// ─── dueReminders ─────────────────────────────────────────────────────────────

describe("dueReminders", () => {
  const baseInvoice = {
    id: "inv-1",
    status: "overdue" as const,
    dueDate: "2024-01-01",
    clientEmail: "test@example.com",
    clientPhone: "+15550100000",
  };

  it("returns no reminders for a paid invoice", () => {
    const today = new Date(2024, 0, 10);
    const result = dueReminders({ ...baseInvoice, status: "paid" }, today, []);
    expect(result).toHaveLength(0);
  });

  it("returns no reminders when not yet overdue", () => {
    const today = new Date(2024, 0, 1); // due today, not overdue
    const result = dueReminders(baseInvoice, today, []);
    expect(result).toHaveLength(0);
  });

  it("returns step 1 email after 1 day overdue", () => {
    const today = new Date(2024, 0, 2); // 1 day after Jan 1
    const result = dueReminders(baseInvoice, today, []);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ step: 1, channel: "email" });
    expect(result[0].skipReason).toBeUndefined();
  });

  it("returns all 4 steps when 30+ days overdue and none sent", () => {
    const today = new Date(2024, 1, 1); // 31 days after Jan 1
    const result = dueReminders(baseInvoice, today, []);
    expect(result).toHaveLength(4);
  });

  it("skips already-sent steps", () => {
    const today = new Date(2024, 1, 1); // 31 days overdue
    const alreadySent = [
      { step: 1, channel: "email" as const },
      { step: 7, channel: "sms" as const },
    ];
    const result = dueReminders(baseInvoice, today, alreadySent);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ step: 14, channel: "email" });
    expect(result[1]).toMatchObject({ step: 30, channel: "sms" });
  });

  it("skips email step when no email, sets skipReason", () => {
    const today = new Date(2024, 0, 2); // 1 day overdue
    const invoice = { ...baseInvoice, clientEmail: null };
    const result = dueReminders(invoice, today, []);
    expect(result).toHaveLength(1);
    expect(result[0].skipReason).toBeDefined();
    expect(result[0].skipReason).toContain("email");
  });

  it("skips sms step when no phone, sets skipReason", () => {
    const today = new Date(2024, 0, 8); // 7 days overdue
    const invoice = { ...baseInvoice, clientPhone: null };
    const result = dueReminders(invoice, today, [{ step: 1, channel: "email" as const }]);
    // Should still have step 7 sms but with skipReason
    const smsStep = result.find((r) => r.step === 7 && r.channel === "sms");
    expect(smsStep).toBeDefined();
    expect(smsStep?.skipReason).toBeDefined();
    expect(smsStep?.skipReason).toContain("phone");
  });

  it("returns steps in correct order (1, 7, 14, 30)", () => {
    const today = new Date(2024, 1, 1); // 31 days overdue
    const result = dueReminders(baseInvoice, today, []);
    const steps = result.map((r) => r.step);
    expect(steps).toEqual([1, 7, 14, 30]);
  });

  // Property-based: paid invoices always get zero reminders
  it("paid invoices never get reminders (property)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 365 }),
        (daysAgo) => {
          const dueDate = new Date(2024, 0, 1);
          const dueDateStr = dueDate.toISOString().split("T")[0];
          const today = new Date(2024, 0, 1 + daysAgo);
          const result = dueReminders(
            { ...baseInvoice, status: "paid", dueDate: dueDateStr },
            today,
            []
          );
          expect(result).toHaveLength(0);
        }
      )
    );
  });

  // Property-based: reminders are only due after their threshold day
  it("step N reminder only appears when daysOverdue >= N (property)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 35 }),
        (daysOverdue) => {
          const baseDate = new Date(2024, 0, 1);
          const dueDate = baseDate.toISOString().split("T")[0];
          const today = new Date(2024, 0, 1 + daysOverdue);
          const result = dueReminders(
            { ...baseInvoice, dueDate, status: daysOverdue > 0 ? "overdue" : "sent" },
            today,
            []
          );
          for (const r of result) {
            expect(daysOverdue).toBeGreaterThanOrEqual(r.step);
          }
        }
      )
    );
  });
});
