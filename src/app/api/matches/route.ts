import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    // المباريات المفتوحة (open)
    const openMatches = await sql`
      select
        id, team1, team2, team1_logo, team2_logo,
        league, match_date, predictions_close_at, status
      from matches
      where status = 'open' and predictions_close_at > now()
      order by match_date asc
    `;

    // المباريات المنتهية (finished)
    const finishedMatches = await sql`
      select
        id, team1, team2, team1_logo, team2_logo,
        league, match_date, final_score1, final_score2, status
      from matches
      where status = 'finished'
      order by match_date desc
      limit 10
    `;

    return NextResponse.json({
      open: openMatches,
      finished: finishedMatches,
    });
  } catch (error) {
    console.error("Fetch matches error:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }
}