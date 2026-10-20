import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await sql`delete from spin_codes where id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}