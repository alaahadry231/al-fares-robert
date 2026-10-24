import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, page, item_type, item_id, item_name, visitor_id } = body;

    if (!visitor_id) return NextResponse.json({ error: "No visitor" }, { status: 400 });

    if (type === "view" && page) {
      await sql`
        insert into site_views (page_path, visitor_id)
        values (${page}, ${visitor_id})
      `;
    } else if (type === "click" && item_type && item_id) {
      await sql`
        insert into site_clicks (item_type, item_id, item_name, visitor_id)
        values (${item_type}, ${item_id}, ${item_name}, ${visitor_id})
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Track error:", error);
    return NextResponse.json({ error: "Track failed" }, { status: 500 });
  }
}