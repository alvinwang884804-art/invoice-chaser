import { NextRequest, NextResponse } from "next/server";
import { getAllInvoices, createInvoice } from "@/lib/db/invoices";
import { getClientById } from "@/lib/db/clients";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const invoices = getAllInvoices();
    return NextResponse.json(invoices);
  } catch (err) {
    console.error("GET /api/invoices", err);
    return NextResponse.json({ error: "Failed to load invoices" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, number, amountCents, dueDate, paymentLink } = body;

    if (!clientId) return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    if (!number?.trim()) return NextResponse.json({ error: "number is required" }, { status: 400 });
    if (!amountCents || amountCents <= 0)
      return NextResponse.json({ error: "amountCents must be greater than 0" }, { status: 400 });
    if (!dueDate) return NextResponse.json({ error: "dueDate is required" }, { status: 400 });

    const client = getClientById(clientId);
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    const invoice = createInvoice({ clientId, number: number.trim(), amountCents, dueDate, paymentLink: paymentLink ?? null });
    return NextResponse.json(invoice, { status: 201 });
  } catch (err) {
    console.error("POST /api/invoices", err);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
