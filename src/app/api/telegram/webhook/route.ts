import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

const ADMIN_ID = "7597432185"; // 👈 الأيدي تبعك

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. التعامل مع الأزرار التفاعلية (Callback Queries)
    if (body.callback_query) {
      const callbackQuery = body.callback_query;
      const chatId = callbackQuery.message.chat.id.toString();
      const messageId = callbackQuery.message.message_id;
      const data = callbackQuery.data;

      // التحقق إنه المستخدم هو المدير
      if (chatId !== ADMIN_ID) {
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            callback_query_id: callbackQuery.id,
            text: "⚠️ غير مصرح لك باستخدام هذه اللوحة.",
            show_alert: true,
          }),
        });
        return NextResponse.json({ ok: true });
      }

      // الرد على الزر عشان ما يظل يلف (Loading)
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: callbackQuery.id }),
      });

      // التعامل مع الأزرار
      if (data === "main_menu") {
        await sendMainMenu(chatId, messageId);
      } else if (data === "codes_menu") {
        await sendCodesMenu(chatId, messageId);
      } else if (data === "stats_menu") {
        await sendStatsMenu(chatId, messageId);
      } else if (data === "prizes_menu") {
        await sendPrizesMenu(chatId, messageId);
      } else if (data === "close_menu") {
        await editMessage(chatId, messageId, "✅ تم إغلاق لوحة التحكم.");
      }

      return NextResponse.json({ ok: true });
    }

    // 2. التعامل مع الأوامر النصية العادية (زي /start أو /admin)
    if (body.message) {
      const message = body.message;
      const chatId = message.chat.id.toString();
      const text = message.text || "";

      if (chatId === ADMIN_ID && (text === "/admin" || text === "/start")) {
        await sendMainMenu(chatId);
      } else if (chatId === ADMIN_ID && text.startsWith("/")) {
         // تجاهل الأوامر التانية للمدير
      } else {
         // التعامل مع رسائل اللاعبين العاديين
         // (هون الكود القديم تبع ربط الحساب أو الإشعارات)
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}

// دالة إرسال القائمة الرئيسية
async function sendMainMenu(chatId: string, messageId?: number) {
  const text = `👋 أهلاً بك يا مدير الموقع!\n\nاختر من القائمة التالية للتحكم بالموقع:`;
  const keyboard = {
    inline_keyboard: [
      [{ text: "🎟️ إدارة الأكواد", callback_data: "codes_menu" }],
      [{ text: "📊 الإحصائيات", callback_data: "stats_menu" }],
      [{ text: "🎁 الجوائز المعلقة", callback_data: "prizes_menu" }],
      [{ text: "❌ إغلاق اللوحة", callback_data: "close_menu" }],
    ],
  };

  if (messageId) {
    await editMessage(chatId, messageId, text, keyboard);
  } else {
    await sendMessage(chatId, text, keyboard);
  }
}

// دالة إرسال قائمة الأكواد
async function sendCodesMenu(chatId: string, messageId: number) {
  const text = `🎟️ *إدارة الأكواد*\n\nاختر الإجراء اللي بدك ياه:`;
  const keyboard = {
    inline_keyboard: [
      [{ text: "➕ توليد 10 أكواد", callback_data: "gen_10" }],
      [{ text: "➕ توليد 50 كود", callback_data: "gen_50" }],
      [{ text: "📋 عرض الأكواد المتاحة", callback_data: "view_codes" }],
      [{ text: "⬅️ رجوع", callback_data: "main_menu" }],
    ],
  };
  await editMessage(chatId, messageId, text, keyboard);
}

// دالة إرسال قائمة الإحصائيات
async function sendStatsMenu(chatId: string, messageId: number) {
  // جلب الإحصائيات من الداتابيس
  const players = await sql`select count(*)::int as count from players`;
  const codes = await sql`select count(*)::int as count from spin_codes where is_used = false`;
  const prizes = await sql`select count(*)::int as count from prizes where status = 'pending'`;

  const text = `📊 *إحصائيات سريعة*\n\n👥 اللاعبين: ${players[0].count}\n🎟️ الأكواد المتاحة: ${codes[0].count}\n🎁 الجوائز المعلقة: ${prizes[0].count}`;
  const keyboard = {
    inline_keyboard: [
      [{ text: "🔄 تحديث", callback_data: "stats_menu" }],
      [{ text: "⬅️ رجوع", callback_data: "main_menu" }],
    ],
  };
  await editMessage(chatId, messageId, text, keyboard, "Markdown");
}

// دالة إرسال قائمة الجوائز
async function sendPrizesMenu(chatId: string, messageId: number) {
  const prizes = await sql`
    select p.id, p.amount, pl.nickname 
    from prizes p
    join players pl on p.player_id = pl.id
    where p.status = 'pending'
    order by p.created_at asc
    limit 5
  `;

  let text = `🎁 *الجوائز المعلقة (أول 5)*\n\n`;
  if (prizes.length === 0) {
    text += "لا توجد جوائز معلقة حالياً.";
  } else {
    prizes.forEach((p: any, i: number) => {
      text += `${i + 1}. ${p.nickname} - ${p.amount.toLocaleString("ar-EG")} ل.س\n`;
    });
  }

  const keyboard = {
    inline_keyboard: [
      [{ text: "⬅️ رجوع", callback_data: "main_menu" }],
    ],
  };
  await editMessage(chatId, messageId, text, keyboard, "Markdown");
}

// دالة مساعدة لإرسال رسالة جديدة
async function sendMessage(chatId: string, text: string, keyboard?: any, parseMode?: string) {
  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: keyboard,
      parse_mode: parseMode,
    }),
  });
}

// دالة مساعدة لتعديل رسالة موجودة
async function editMessage(chatId: string, messageId: number, text: string, keyboard?: any, parseMode?: string) {
  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      reply_markup: keyboard,
      parse_mode: parseMode,
    }),
  });
}