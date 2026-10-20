import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const data = await sql`
      select
        id,
        nickname as name,
        total_points as points,
        created_at
      from players
      where is_banned = false
      order by total_points desc, created_at asc
      limit 50
    `;

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Fetch leaderboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}