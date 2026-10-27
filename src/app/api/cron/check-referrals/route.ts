import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

const CHANNEL_USERNAME = "@AlFaresRobert";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // جلب كل الإحالات النشطة
    const activeReferrals = await sql`
      select r.id, r.referred_id, p.telegram_chat_id 
      from referrals r
      join players p on r.referred_id = p.id
      where r.status = 'active'
    `;

    let cancelledCount = 0;

    for (const ref of activeReferrals) {
      if (!ref.telegram_chat_id) continue;

      try {
        // التحقق من الاشتراك بالقناة
        const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getChatMember`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: CHANNEL_USERNAME, user_id: ref.telegram_chat_id }),
        });
        const data = await res.json();

        const isMember = data.ok && (data.result.status === "member" || data.result.status === "administrator" || data.result.status === "creator");

        if (!isMember) {
          // إلغاء الإحالة
          await sql`update referrals set status = 'cancelled' where id = ${ref.id}`;
          cancelledCount++;
        }
      } catch (e) {
        console.error(`Error checking referral ${ref.id}`);
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    return NextResponse.json({ success: true, cancelled: cancelledCount });
  } catch (error) {
    console.error("Cron check referrals error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}