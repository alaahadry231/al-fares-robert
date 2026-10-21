import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { sendTelegramNotification } from "@/lib/telegram";
import { waitUntil } from "@vercel/functions";

export async function GET(req: NextRequest) {
  try {
    // 1. حماية الـ API (عشان أي حد ما يقدر يشغلها)
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. نجيب الجوائز اللي انتهت صلاحيتها (تاريخ الانتهاء أصغر من الآن)
    // وحالتها لسا pending
    const expiredPrizes = await sql`
      select p.id, p.amount, p.player_id, pl.telegram_chat_id, pl.nickname
      from prizes p
      join players pl on p.player_id = pl.id
      where p.status = 'pending' 
        and p.deadline < now()
    `;

    if (expiredPrizes.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "No expired prizes found",
        count: 0 
      });
    }

    // 3. نغير حالتهم لـ expired
    const prizeIds = expiredPrizes.map((p) => p.id);
    
    // بنعمل تحديث لكل الجوائز دفعة وحدة
    await sql`
      update prizes
      set status = 'expired'
      where id = any(${prizeIds})
    `;

    // 4. نبعت إشعار لكل لاعب
    for (const prize of expiredPrizes) {
      if (prize.telegram_chat_id) {
        waitUntil(
          sendTelegramNotification(
            `❌ <b>انتهت صلاحية جائزتك</b>\n\n👤 ${prize.nickname}\n💰 المبلغ: ${prize.amount.toLocaleString("ar-EG")} ل.س\n\n⚠️ للأسف، مرت 30 يوم على فوزك ولم يتم استلام الجائزة.`,
            prize.telegram_chat_id
          )
        );
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Expired prizes processed successfully",
      count: expiredPrizes.length 
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}