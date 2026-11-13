import { NextRequest, NextResponse } from "next/server";
import { getInvoicesByClient } from "@/lib/db/invoices";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const invoices = getInvoicesByClient(id);
  return NextResponse.json(invoices);
}
