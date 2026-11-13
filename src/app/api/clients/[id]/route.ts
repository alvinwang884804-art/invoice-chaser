import { NextRequest, NextResponse } from "next/server";
import { getClientById, updateClient, deleteClient, clientOutstandingCents } from "@/lib/db/clients";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const client = getClientById(id);
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const outstanding = clientOutstandingCents(id);
  return NextResponse.json({ client, outstanding });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    const updated = updateClient(id, {
      name: name.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      notes: notes?.trim() || null,
    });
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ok = deleteClient(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
