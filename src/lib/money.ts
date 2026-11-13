/**
 * Money utilities — all amounts stored as integer cents (no float math).
 * Currency: USD for the demo.
 */

/** Format cents as a USD currency string, e.g. 125050 → "$1,250.50" */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

/** Parse a dollar string like "1250.50" or "1,250.50" to integer cents. */
export function parseDollars(value: string): number {
  const cleaned = value.replace(/[$,\s]/g, "");
  const float = parseFloat(cleaned);
  if (isNaN(float) || float < 0) throw new Error(`Invalid dollar value: ${value}`);
  // Round to nearest cent to avoid float precision issues
  return Math.round(float * 100);
}

/** Sum an array of cent values. */
export function sumCents(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}

/** Calculate the balance remaining on an invoice after payments. */
export function invoiceBalance(amountCents: number, paidCents: number): number {
  return Math.max(0, amountCents - paidCents);
}
