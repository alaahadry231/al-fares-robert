import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

// GET: جلب كل البكجات
export async function GET() {
  try {
    const data = await sql`
      select * from sports_pages
      order by is_archived asc, created_at desc
    `;
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST: إضافة بكج جديد
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, code, category, rate, matches_count } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: "الاسم والكود مطلوبين" },
        { status: 400 }
      );
    }

    const result = await sql`
      insert into sports_pages (name, description, code, category, rate, matches_count)
      values (${name}, ${description || ""}, ${code}, ${category || "عام"}, ${rate || "×1"}, ${matches_count || 0})
      returning *
    `;

    return NextResponse.json({ data: result[0] });
  } catch (error) {
    console.error("Insert error:", error);
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }
}