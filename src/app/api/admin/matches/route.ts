import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const data = await sql`
      select * from matches
      order by match_date desc
    `;
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      team1,
      team2,
      team1_logo,
      team2_logo,
      league,
      match_date,
      predictions_close_at,
    } = body;

    if (!team1 || !team2 || !match_date || !predictions_close_at) {
      return NextResponse.json(
        { error: "جميع الحقول المطلوبة مطلوبة" },
        { status: 400 }
      );
    }

    const result = await sql`
      insert into matches (
        team1, team2, team1_logo, team2_logo, league,
        match_date, predictions_close_at
      )
      values (
        ${team1}, ${team2}, ${team1_logo || ""}, ${team2_logo || ""},
        ${league || ""}, ${match_date}, ${predictions_close_at}
      )
      returning *
    `;

    return NextResponse.json({ data: result[0] });
  } catch (error) {
    console.error("Insert error:", error);
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }
}