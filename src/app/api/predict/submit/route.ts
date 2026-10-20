import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { sendTelegramNotification } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { match_id, player_id, score1, score2 } = body;

    if (!match_id || !player_id) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }

    if (typeof score1 !== "number" || typeof score2 !== "number") {
      return NextResponse.json({ error: "النتيجة غير صحيحة" }, { status: 400 });
    }

    if (score1 < 0 || score1 > 50 || score2 < 0 || score2 > 50) {
      return NextResponse.json({ error: "النتيجة غير معقولة" }, { status: 400 });
    }

    const match = await sql`
      select id, status, predictions_close_at, team1, team2
      from matches
      where id = ${match_id}
      limit 1
    `;

    if (match.length === 0) {
      return NextResponse.json({ error: "المباراة غير موجودة" }, { status: 404 });
    }

    if (match[0].status !== "open") {
      return NextResponse.json({ error: "التوقعات مغلقة على هذه المباراة" }, { status: 400 });
    }

    if (new Date(match[0].predictions_close_at) < new Date()) {
      return NextResponse.json({ error: "انتهى وقت التوقع" }, { status: 400 });
    }

    const existing = await sql`
      select id from predictions
      where match_id = ${match_id} and player_id = ${player_id}
      limit 1
    `;

    if (existing.length > 0) {
      return NextResponse.json({ error: "لقد توقعت هذه المباراة مسبقاً" }, { status: 400 });
    }

    const result = await sql`
      insert into predictions (match_id, player_id, score1, score2)
      values (${match_id}, ${player_id}, ${score1}, ${score2})
      returning *
    `;

    // ✅ إشعار للمدير بتوقع جديد
    const playerData = await sql`
      select nickname, telegram_username from players where id = ${player_id} limit 1
    `;
    const playerName = playerData.length > 0 ? playerData[0].nickname : "لاعب";
    const playerUsername = playerData.length > 0 ? playerData[0].telegram_username : "";

    sendTelegramNotification(
      `🎯 <b>توقع جديد</b>\n\n👤 اللاعب: ${playerName}${
        playerUsername ? ` (@${playerUsername})` : ""
      }\n⚽ ${match[0].team1} × ${match[0].team2}\n📊 التوقع: ${score1} - ${score2}`
    ).catch(console.error);

    return NextResponse.json({ success: true, prediction: result[0] });
  } catch (error) {
    console.error("Submit prediction error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}