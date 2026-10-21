import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get("player_id");

    if (!playerId) {
      return NextResponse.json({ error: "player_id مطلوب" }, { status: 400 });
    }

    const result = await sql`
      select telegram_chat_id from players where id = ${playerId} limit 1
    `;

    const isLinked = result.length > 0 && !!result[0].telegram_chat_id;

    return NextResponse.json({ isLinked });
  } catch (error) {
    console.error("Check link error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}