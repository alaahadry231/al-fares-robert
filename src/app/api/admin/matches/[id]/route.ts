import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();

    // تغيير الحالة (فتح/إغلاق)
    if (body.action === "change_status") {
      const result = await sql`
        update matches
        set status = ${body.status}
        where id = ${id}
        returning *
      `;
      return NextResponse.json({ data: result[0] });
    }

    // ✅ إنهاء المباراة + حساب النقاط
    if (body.action === "finish") {
      const { final_score1, final_score2 } = body;

      // 1. نحدّث المباراة
      const matchResult = await sql`
        update matches
        set status = 'finished',
            final_score1 = ${final_score1},
            final_score2 = ${final_score2}
        where id = ${id}
        returning *
      `;

      // 2. نجيب كل التوقعات على هذه المباراة
      const predictions = await sql`
        select id, player_id, score1, score2
        from predictions
        where match_id = ${id}
      `;

      // 3. نحسب النقاط لكل توقع
      for (const prediction of predictions) {
        const isCorrect =
          prediction.score1 === final_score1 &&
          prediction.score2 === final_score2;

        const points = isCorrect ? 5000 : 0;

        // نحدّث التوقع
        await sql`
          update predictions
          set is_correct = ${isCorrect}, points = ${points}
          where id = ${prediction.id}
        `;

        // نحدّث نقاط اللاعب
        if (points > 0) {
          await sql`
            update players
            set total_points = total_points + ${points}
            where id = ${prediction.player_id}
          `;
        }
      }

      return NextResponse.json({
        data: matchResult[0],
        stats: {
          total_predictions: predictions.length,
          correct_predictions: predictions.filter(
            (p) => p.score1 === final_score1 && p.score2 === final_score2
          ).length,
        },
      });
    }

    // تعديل عادي
    const {
      team1, team2, team1_logo, team2_logo, league,
      match_date, predictions_close_at,
    } = body;

    const result = await sql`
      update matches
      set team1 = ${team1},
          team2 = ${team2},
          team1_logo = ${team1_logo || ""},
          team2_logo = ${team2_logo || ""},
          league = ${league || ""},
          match_date = ${match_date},
          predictions_close_at = ${predictions_close_at}
      where id = ${id}
      returning *
    `;

    return NextResponse.json({ data: result[0] });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await sql`delete from matches where id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}