import { NextResponse } from "next/server";
import { getAllReminders } from "@/lib/db/reminders";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const reminders = getAllReminders();
    return NextResponse.json(reminders);
  } catch (err) {
    console.error("GET /api/reminders", err);
    return NextResponse.json({ error: "Failed to load reminders" }, { status: 500 });
  }
}
