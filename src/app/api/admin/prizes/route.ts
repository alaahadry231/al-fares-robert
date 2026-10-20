import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const data = await sql`
      select
        p.id,
        p.amount,
        p.status,
        p.created_at,
        p.delivered_at,
        p.deadline,
        sc.code,
        sc.used_at
      from prizes p
      left join spin_codes sc on p.code_id = sc.id
      order by p.created_at desc
    `;
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}