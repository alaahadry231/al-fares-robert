import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const data = await sql`
      select id, name, description, code, category, rate, matches_count, status, is_featured, is_archived, image_url
      from sports_pages
      where is_published = true and is_archived = false
      order by is_featured desc, sort_order asc, created_at desc
    `;
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}