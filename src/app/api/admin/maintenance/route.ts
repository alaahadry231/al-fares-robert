import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const result = await sql`
      select maintenance_mode from app_settings where id = 1
    `;
    const enabled = result.length > 0 ? result[0].maintenance_mode : false;
    return NextResponse.json({ enabled });
  } catch (error) {
    console.error("Get maintenance error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { enabled } = body;

    if (typeof enabled !== "boolean") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    await sql`
      update app_settings
      set maintenance_mode = ${enabled},
          updated_at = now()
      where id = 1
    `;

    return NextResponse.json({ success: true, enabled });
  } catch (error) {
    console.error("Update maintenance error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}