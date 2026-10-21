import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, description, bot_url, image_url, is_published } = body;

    if (!name || !bot_url) {
      return NextResponse.json(
        { error: "الاسم ورابط البوت مطلوبين" },
        { status: 400 }
      );
    }

    const result = await sql`
      update trusted_bots
      set name = ${name},
          description = ${description || ""},
          bot_url = ${bot_url},
          image_url = ${image_url || ""},
          is_published = ${is_published ?? true}
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
    await sql`delete from trusted_bots where id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}