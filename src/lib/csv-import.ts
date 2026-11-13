/**
 * CSV invoice import.
 * Expected columns (case-insensitive): clientName, invoiceNumber, amount, dueDate
 * Optional: paymentLink, clientEmail, clientPhone
 */

import { getDb } from "./db/index";
import { getAllClients, createClient } from "./db/clients";
import { createInvoice } from "./db/invoices";
import { parseDollars } from "./money";

export interface ImportRow {
  rowIndex: number;
  success: boolean;
  invoiceId?: string;
  error?: string;
}

export interface ImportResult {
  total: number;
  imported: number;
  failed: number;
  rows: ImportRow[];
}

/** Parse a CSV string and import invoices. Creates clients that don't exist. */
export async function importInvoicesFromCsv(csv: string): Promise<ImportResult> {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) {
    return { total: 0, imported: 0, failed: 0, rows: [] };
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows = lines.slice(1);

  const result: ImportResult = {
    total: rows.length,
    imported: 0,
    failed: 0,
    rows: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const values = parseCsvRow(rows[i]);
    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] ?? "";
    });

    try {
      // Required fields
      const clientName = rowObj["clientname"] || rowObj["client_name"] || rowObj["client"];
      const invoiceNumber = rowObj["invoicenumber"] || rowObj["invoice_number"] || rowObj["number"];
      const amountRaw = rowObj["amount"];
      const dueDateRaw = rowObj["duedate"] || rowObj["due_date"] || rowObj["due"];

      if (!clientName) throw new Error("Missing clientName");
      if (!invoiceNumber) throw new Error("Missing invoiceNumber");
      if (!amountRaw) throw new Error("Missing amount");
      if (!dueDateRaw) throw new Error("Missing dueDate");

      const amountCents = parseDollars(amountRaw);
      if (amountCents <= 0) throw new Error("Amount must be greater than zero");

      const dueDate = normalizeDate(dueDateRaw);

      // Find or create client
      const clients = getAllClients();
      let client = clients.find(
        (c) => c.name.toLowerCase() === clientName.toLowerCase()
      );
      if (!client) {
        client = createClient({
          name: clientName,
          email: rowObj["clientemail"] || rowObj["email"] || null,
          phone: rowObj["clientphone"] || rowObj["phone"] || null,
          notes: null,
        });
      }

      const invoice = createInvoice({
        clientId: client.id,
        number: invoiceNumber,
        amountCents,
        dueDate,
        paymentLink: rowObj["paymentlink"] || rowObj["payment_link"] || null,
      });

      result.imported++;
      result.rows.push({ rowIndex: i + 2, success: true, invoiceId: invoice.id });
    } catch (err) {
      result.failed++;
      result.rows.push({
        rowIndex: i + 2,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return result;
}

/** Minimal CSV row parser — handles quoted fields with commas. */
function parseCsvRow(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/** Normalize common date formats to YYYY-MM-DD. */
function normalizeDate(raw: string): string {
  const s = raw.trim();
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // MM/DD/YYYY or M/D/YYYY
  const mdyMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdyMatch) {
    const [, m, d, y] = mdyMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // Try native parse as a last resort
  const parsed = new Date(s);
  if (isNaN(parsed.getTime())) throw new Error(`Invalid date: ${raw}`);
  return parsed.toISOString().split("T")[0];
}
