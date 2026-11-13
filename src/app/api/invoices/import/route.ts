import { NextRequest, NextResponse } from "next/server";
import { importInvoicesFromCsv } from "@/lib/csv-import";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { csv } = body;
    if (!csv || typeof csv !== "string") {
      return NextResponse.json({ error: "csv string is required" }, { status: 400 });
    }
    const result = await importInvoicesFromCsv(csv);
    return NextResponse.json(result);
  } catch (err) {
    console.error("POST /api/invoices/import", err);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
