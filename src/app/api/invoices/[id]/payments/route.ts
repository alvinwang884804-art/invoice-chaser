import { NextRequest, NextResponse } from "next/server";
import { getPaymentsByInvoice, recordPayment } from "@/lib/db/payments";
import { getInvoiceById } from "@/lib/db/invoices";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const payments = getPaymentsByInvoice(id);
  return NextResponse.json(payments);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { amountCents, method } = body;

    if (!amountCents || amountCents <= 0)
      return NextResponse.json({ error: "amountCents must be greater than 0" }, { status: 400 });

    const invoice = getInvoiceById(id);
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const payment = recordPayment({ invoiceId: id, amountCents, method: method ?? null });
    return NextResponse.json(payment, { status: 201 });
  } catch (err) {
    console.error("POST /api/invoices/[id]/payments", err);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
