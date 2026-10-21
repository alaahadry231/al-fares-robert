import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const result = await sql`
      select maintenance_mode from app_settings where id = 1 limit 1
    `;

    const isMaintenance = result.length > 0 ? result[0].maintenance_mode : false;

    return NextResponse.json({ maintenance_mode: isMaintenance });
  } catch (error) {
    console.error("Maintenance check error:", error);
    return NextResponse.json({ maintenance_mode: false });
  }
}