/**
 * Tests for money utilities — cents math, formatting, parsing.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { formatCents, parseDollars, sumCents, invoiceBalance } from "@/lib/money";

describe("formatCents", () => {
  it("formats zero as $0.00", () => {
    expect(formatCents(0)).toBe("$0.00");
  });

  it("formats 100 cents as $1.00", () => {
    expect(formatCents(100)).toBe("$1.00");
  });

  it("formats 125050 as $1,250.50", () => {
    expect(formatCents(125050)).toBe("$1,250.50");
  });

  it("formats 1 cent correctly", () => {
    expect(formatCents(1)).toBe("$0.01");
  });
});

describe("parseDollars", () => {
  it("parses integer string", () => {
    expect(parseDollars("1500")).toBe(150000);
  });

  it("parses decimal string", () => {
    expect(parseDollars("1250.50")).toBe(125050);
  });

  it("strips dollar sign", () => {
    expect(parseDollars("$42.00")).toBe(4200);
  });

  it("strips commas", () => {
    expect(parseDollars("1,500.00")).toBe(150000);
  });

  it("throws on negative", () => {
    expect(() => parseDollars("-10")).toThrow();
  });

  it("throws on non-numeric", () => {
    expect(() => parseDollars("abc")).toThrow();
  });

  // Property-based: parseDollars(formatCents(x) / 100 string) round-trips
  it("round-trips dollars via formatCents (property)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000_00 }), // up to $1M
        (cents) => {
          // formatCents gives "$X,XXX.XX" — strip $ and , then parse back
          const formatted = formatCents(cents).replace(/[$,]/g, "");
          const parsed = parseDollars(formatted);
          expect(parsed).toBe(cents);
        }
      )
    );
  });
});

describe("sumCents", () => {
  it("sums empty array to 0", () => {
    expect(sumCents([])).toBe(0);
  });

  it("sums correctly", () => {
    expect(sumCents([100, 200, 300])).toBe(600);
  });

  // Property-based: sum is commutative
  it("sum is commutative (property)", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 100000 }), { maxLength: 20 }),
        (amounts) => {
          const shuffled = [...amounts].sort(() => Math.random() - 0.5);
          expect(sumCents(amounts)).toBe(sumCents(shuffled));
        }
      )
    );
  });
});

describe("invoiceBalance", () => {
  it("full payment gives zero balance", () => {
    expect(invoiceBalance(10000, 10000)).toBe(0);
  });

  it("partial payment reduces balance", () => {
    expect(invoiceBalance(10000, 3000)).toBe(7000);
  });

  it("overpayment gives zero (not negative)", () => {
    expect(invoiceBalance(10000, 15000)).toBe(0);
  });

  it("no payment leaves full balance", () => {
    expect(invoiceBalance(10000, 0)).toBe(10000);
  });

  // Property-based: balance is always >= 0
  it("balance is never negative (property)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1_000_000 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        (amount, paid) => {
          expect(invoiceBalance(amount, paid)).toBeGreaterThanOrEqual(0);
        }
      )
    );
  });

  // Property-based: balance + paid = amount when paid <= amount
  it("balance + paid = amount when paid <= amount (property)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1_000_000 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        (amount, paidExtra) => {
          const paid = Math.min(paidExtra, amount); // ensure paid <= amount
          expect(invoiceBalance(amount, paid) + paid).toBe(amount);
        }
      )
    );
  });
});
