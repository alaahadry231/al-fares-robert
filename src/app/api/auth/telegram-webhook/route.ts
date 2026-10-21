import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { sendTelegramNotification } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.message) {
      return NextResponse.json({ ok: true });
    }

    const chatId = body.message.chat.id.toString();
    const text = body.message.text || "";

    if (text.startsWith("/start")) {
      const parts = text.split(" ");
      const payload = parts[1];

      if (payload && payload.startsWith("player_")) {
        const playerId = payload.replace("player_", "");

        const result = await sql`
          update players
          set telegram_chat_id = ${chatId}
          where id = ${playerId}
          returning *
        `;

        if (result.length > 0) {
          // ✅ إشعار للاعب (مو للمدير)
          await sendTelegramNotification(
            `✅ تم ربط حسابك بنجاح!\n\n👤 ${result[0].nickname}\n\nالآن رح تستلم إشعارات الجوائز والتوقعات هنا.`,
            chatId
          );
        } else {
          await sendTelegramNotification(
            `⚠️ لم نجد حسابك. تأكد من تسجيل الدخول على الموقع أولاً.`,
            chatId
          );
        }
      } else {
        await sendTelegramNotification(
          `👋 أهلاً بك في بوت Al Fares Robert!\n\n🔗 لربط حسابك، افتح صفحة "جوائزي" على الموقع واضغط على زر "ربط الحساب".`,
          chatId
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}