import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get("player_id");

    if (!playerId) {
      return NextResponse.json({ error: "player_id مطلوب" }, { status: 400 });
    }

    const playerData = await sql`
      select
        id,
        telegram_id,
        telegram_username,
        nickname,
        total_points,
        is_banned,
        telegram_chat_id,
        created_at
      from players
      where id = ${playerId}
      limit 1
    `;

    if (playerData.length === 0) {
      return NextResponse.json({ error: "اللاعب غير موجود" }, { status: 404 });
    }

    const player = playerData[0];

    const predictionsCount = await sql`
      select count(*)::int as count from predictions where player_id = ${playerId}
    `;

    const prizesCount = await sql`
      select count(*)::int as count from prizes where player_id = ${playerId}
    `;

    return NextResponse.json({
      player: {
        id: player.id,
        telegram_id: player.telegram_id,
        telegram_username: player.telegram_username,
        nickname: player.nickname,
        total_points: player.total_points,
        is_banned: player.is_banned,
        is_linked: !!player.telegram_chat_id,
        created_at: player.created_at,
      },
      stats: {
        predictions_count: predictionsCount[0].count,
        prizes_count: prizesCount[0].count,
      },
    });
  } catch (error) {
    console.error("Fetch player error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}