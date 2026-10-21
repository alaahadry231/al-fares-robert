import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const data = await sql`
      select id, name, description, bot_url, image_url
      from trusted_bots
      where is_published = true
      order by sort_order asc, created_at desc
    `;
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Fetch trusted bots error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}