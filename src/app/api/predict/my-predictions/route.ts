import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get("player_id");

    if (!playerId) {
      return NextResponse.json({ error: "player_id مطلوب" }, { status: 400 });
    }

    const data = await sql`
      select
        p.id,
        p.match_id,
        p.score1,
        p.score2,
        p.points,
        p.is_correct,
        p.created_at,
        m.team1,
        m.team2,
        m.match_date,
        m.status as match_status,
        m.final_score1,
        m.final_score2
      from predictions p
      join matches m on p.match_id = m.id
      where p.player_id = ${playerId}
      order by p.created_at desc
    `;

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Fetch predictions error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}