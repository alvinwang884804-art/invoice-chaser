import { NextResponse } from "next/server";
import { runReminders } from "@/lib/reminders/runner";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await runReminders();
    return NextResponse.json(result);
  } catch (err) {
    console.error("POST /api/reminders/run", err);
    return NextResponse.json({ error: "Failed to run reminders" }, { status: 500 });
  }
}
