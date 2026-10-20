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
        p.amount,
        p.status,
        p.created_at,
        p.delivered_at,
        p.deadline,
        sc.code
      from prizes p
      left join spin_codes sc on p.code_id = sc.id
      where p.player_id = ${playerId}
      order by p.created_at desc
    `;

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Fetch prizes error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}