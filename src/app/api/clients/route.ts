import { NextRequest, NextResponse } from "next/server";
import { getAllClients, createClient, clientOutstandingCents } from "@/lib/db/clients";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const clients = getAllClients();
    // Add outstanding balance to each client
    const withOutstanding = clients.map((c) => ({
      ...c,
      outstanding: clientOutstandingCents(c.id),
    }));
    return NextResponse.json(withOutstanding);
  } catch (err) {
    console.error("GET /api/clients", err);
    return NextResponse.json({ error: "Failed to load clients" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, notes } = body;

    if (!name?.trim())
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    if (!email?.trim() && !phone?.trim())
      return NextResponse.json(
        { error: "At least one of email or phone is required" },
        { status: 400 }
      );

    const client = createClient({
      name: name.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      notes: notes?.trim() || null,
    });
    return NextResponse.json(client, { status: 201 });
  } catch (err) {
    console.error("POST /api/clients", err);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
