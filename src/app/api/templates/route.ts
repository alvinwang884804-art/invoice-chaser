import { NextResponse } from "next/server";
import { getAllTemplates, upsertDefaultTemplates } from "@/lib/db/templates";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    upsertDefaultTemplates(); // ensure defaults exist
    const templates = getAllTemplates();
    return NextResponse.json(templates);
  } catch (err) {
    console.error("GET /api/templates", err);
    return NextResponse.json({ error: "Failed to load templates" }, { status: 500 });
  }
}
