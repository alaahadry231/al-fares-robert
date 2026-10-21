import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const data = await sql`
      select
        id,
        telegram_id,
        telegram_username,
        nickname,
        total_points,
        is_banned,
        ban_reason,
        ban_until,
        telegram_chat_id,
        created_at
      from players
      order by created_at desc
    `;

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Fetch players error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}