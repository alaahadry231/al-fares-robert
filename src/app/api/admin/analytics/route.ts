import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    // 1. إجمالي الزوار الفريدين (Unique Visitors)
    const uniqueVisitors = await sql`
      select count(distinct visitor_id)::int as count from site_views
    `;

    // 2. إجمالي الزيارات (Page Views)
    const totalViews = await sql`
      select count(*)::int as count from site_views
    `;

    // 3. تفصيل الزيارات حسب كل صفحة
    const viewsByPage = await sql`
      select page_path, count(*)::int as views, count(distinct visitor_id)::int as unique_visitors
      from site_views
      group by page_path
      order by views desc
    `;

    // 4. إجمالي النقرات على البكجات
    const pageClicks = await sql`
      select count(*)::int as count from site_clicks where item_type = 'page'
    `;

    // 5. إجمالي النقرات على البوتات
    const botClicks = await sql`
      select count(*)::int as count from site_clicks where item_type = 'bot'
    `;

    // 6. أكثر 3 بكجات نقرات
    const topPages = await sql`
      select item_name, count(*)::int as clicks
      from site_clicks
      where item_type = 'page'
      group by item_name
      order by clicks desc
      limit 3
    `;

    // 7. أكثر 3 بوتات نقرات
    const topBots = await sql`
      select item_name, count(*)::int as clicks
      from site_clicks
      where item_type = 'bot'
      group by item_name
      order by clicks desc
      limit 3
    `;

    return NextResponse.json({
      visitors: {
        unique: uniqueVisitors[0].count,
        total_views: totalViews[0].count,
      },
      clicks: {
        pages: pageClicks[0].count,
        bots: botClicks[0].count,
      },
      views_by_page: viewsByPage,
      top_pages: topPages,
      top_bots: topBots,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}