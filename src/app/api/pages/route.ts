import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const data = await sql`
      select
        id, name, description, code, category, rate,
        matches_count, status, is_featured, is_archived, is_published,
        sort_order, created_at, updated_at
      from sports_pages
      where is_published = true and is_archived = false
      order by is_featured desc, sort_order asc, created_at desc
    `;

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Fetch pages error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pages" },
      { status: 500 }
    );
  }
}