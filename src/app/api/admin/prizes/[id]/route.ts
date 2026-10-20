import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "الحالة مطلوبة" }, { status: 400 });
    }

    // إذا "delivered" → نسجل وقت التسليم
    if (status === "delivered") {
      const result = await sql`
        update prizes
        set status = ${status}, delivered_at = now()
        where id = ${id}
        returning *
      `;
      return NextResponse.json({ data: result[0] });
    }

    // أي حالة أخرى
    const result = await sql`
      update prizes
      set status = ${status}
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
    await sql`delete from prizes where id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}