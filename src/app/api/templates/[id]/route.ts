import { NextRequest, NextResponse } from "next/server";
import { getTemplateById, updateTemplate } from "@/lib/db/templates";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const template = getTemplateById(id);
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(template);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { subject, body: bodyText } = body;

    if (!bodyText?.trim())
      return NextResponse.json({ error: "body is required" }, { status: 400 });

    const updated = updateTemplate(id, { subject: subject ?? null, body: bodyText });
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}
