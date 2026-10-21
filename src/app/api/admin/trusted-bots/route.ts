import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const data = await sql`
      select * from trusted_bots
      order by sort_order asc, created_at desc
    `;
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, bot_url, image_url } = body;

    if (!name || !bot_url) {
      return NextResponse.json(
        { error: "الاسم ورابط البوت مطلوبين" },
        { status: 400 }
      );
    }

    const result = await sql`
      insert into trusted_bots (name, description, bot_url, image_url)
      values (${name}, ${description || ""}, ${bot_url}, ${image_url || ""})
      returning *
    `;

    return NextResponse.json({ data: result[0] });
  } catch (error) {
    console.error("Insert error:", error);
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }
}