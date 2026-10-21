import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, nickname, ban_reason } = body;

    // 1. تعديل الاسم
    if (action === "update_name") {
      if (!nickname || nickname.trim() === "") {
        return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 });
      }

      const result = await sql`
        update players
        set nickname = ${nickname.trim()}, updated_at = now()
        where id = ${id}
        returning *
      `;
      return NextResponse.json({ data: result[0] });
    }

    // 2. حظر اللاعب
    if (action === "ban") {
      const result = await sql`
        update players
        set is_banned = true,
            ban_reason = ${ban_reason || "مخالفة الشروط"},
            ban_until = now() + interval '30 days',
            updated_at = now()
        where id = ${id}
        returning *
      `;
      return NextResponse.json({ data: result[0] });
    }

    // 3. فك الحظر
    if (action === "unban") {
      const result = await sql`
        update players
        set is_banned = false,
            ban_reason = '',
            ban_until = null,
            updated_at = now()
        where id = ${id}
        returning *
      `;
      return NextResponse.json({ data: result[0] });
    }

    return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  } catch (error) {
    console.error("Update player error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}