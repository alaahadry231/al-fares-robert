import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Toggle: تغيير الحالة (won/lost/pending)
    if (body.action === "change_status") {
      const result = await sql`
        update sports_pages
        set status = ${body.status}, updated_at = now()
        where id = ${id}
        returning *
      `;
      return NextResponse.json({ data: result[0] });
    }

    // Toggle: featured
    if (body.action === "toggle_featured") {
      const result = await sql`
        update sports_pages
        set is_featured = not is_featured, updated_at = now()
        where id = ${id}
        returning *
      `;
      return NextResponse.json({ data: result[0] });
    }

    // Toggle: archive
    if (body.action === "toggle_archive") {
      const result = await sql`
        update sports_pages
        set is_archived = not is_archived, updated_at = now()
        where id = ${id}
        returning *
      `;
      return NextResponse.json({ data: result[0] });
    }

    // تعديل عادي
    const { name, description, code, category, rate, matches_count } = body;

    const result = await sql`
      update sports_pages
      set name = ${name},
          description = ${description || ""},
          code = ${code},
          category = ${category || "عام"},
          rate = ${rate || "×1"},
          matches_count = ${matches_count || 0},
          updated_at = now()
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
    await sql`delete from sports_pages where id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}