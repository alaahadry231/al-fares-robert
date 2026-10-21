import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { sendTelegramNotification } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // نتحقق إنه في رسالة
    if (!body.message) {
      return NextResponse.json({ ok: true });
    }

    const chatId = body.message.chat.id.toString();
    const text = body.message.text || "";
    const username = body.message.from?.username || "";

    // إذا /start
    if (text.startsWith("/start")) {
      // نستخرج player_id من الرابط (start=123)
      const parts = text.split(" ");
      const payload = parts[1];

      if (payload && payload.startsWith("player_")) {
        const playerId = payload.replace("player_", "");

        // نربط chat_id باللاعب
        const result = await sql`
          update players
          set telegram_chat_id = ${chatId}
          where id = ${playerId}
          returning *
        `;

        if (result.length > 0) {
          await sendTelegramNotification(
            `✅ تم ربط حسابك بنجاح!\n\n👤 ${result[0].nickname}\n\nالآن رح تستلم إشعارات الجوائز والتوقعات هنا.`
          );
        } else {
          await sendTelegramNotification(
            `⚠️ لم نجد حسابك. تأكد من تسجيل الدخول على الموقع أولاً.`
          );
        }
      } else {
        await sendTelegramNotification(
          `👋 أهلاً بك في بوت Al Fares Robert!\n\n🔗 لربط حسابك، افتح صفحة "حسابي" على الموقع واضغط على زر "ربط الحساب".`
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}