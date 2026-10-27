import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

const ADMIN_ID = "7597432185";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.callback_query) {
      const callbackQuery = body.callback_query;
      const chatId = callbackQuery.message.chat.id.toString();
      const messageId = callbackQuery.message.message_id;
      const data = callbackQuery.data;

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

      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: callbackQuery.id }),
      });

      // توجيه الأزرار
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
      // 👇 الأزرار الجديدة للأكواد
      else if (data === "gen_10") {
        await generateCodes(chatId, messageId, 10);
      } else if (data === "gen_50") {
        await generateCodes(chatId, messageId, 50);
      } else if (data === "view_codes") {
        await viewAvailableCodes(chatId, messageId);
      }

      return NextResponse.json({ ok: true });
    }

    if (body.message) {
      const message = body.message;
      const chatId = message.chat.id.toString();
      const text = message.text || "";

      if (chatId === ADMIN_ID && (text === "/admin" || text === "/start")) {
        await sendMainMenu(chatId);
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
  if (messageId) await editMessage(chatId, messageId, text, keyboard);
  else await sendMessage(chatId, text, keyboard);
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

// دالة توليد الأكواد
async function generateCodes(chatId: string, messageId: number, count: number) {
  try {
    const generatedCodes: string[] = [];
    
    // توليد الأكواد وإدخالها بقاعدة البيانات
    for (let i = 0; i < count; i++) {
      const randomCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      await sql`
        insert into spin_codes (code, is_used) 
        values (${randomCode}, false)
      `;
      generatedCodes.push(randomCode);
    }

    // تجهيز النص للرد
    let responseText = `✅ تم توليد ${count} كود بنجاح!\n\n`;
    responseText += generatedCodes.join("\n");
    
    // إرسال رسالة جديدة بالأكواد (عشان ما تتعدل الرسالة القديمة وتصير طويلة)
    await sendMessage(chatId, `\`\`\`\n${responseText}\n\`\`\``, {
      inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "codes_menu" }]],
    }, "MarkdownV2");

    // تحديث رسالة القائمة القديمة
    await editMessage(chatId, messageId, `✅ تم توليد ${count} كود. (شوف الرسالة اللي تحت)`, {
      inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "codes_menu" }]],
    });

  } catch (error) {
    console.error("Generate codes error:", error);
    await editMessage(chatId, messageId, "❌ حدث خطأ أثناء توليد الأكواد.", {
      inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "codes_menu" }]],
    });
  }
}

// دالة عرض الأكواد المتاحة
async function viewAvailableCodes(chatId: string, messageId: number) {
  try {
    const availableCodes = await sql`
      select code from spin_codes where is_used = false limit 20
    `;

    let responseText = `📋 *الأكواد المتاحة (أول 20)*\n\n`;
    if (availableCodes.length === 0) {
      responseText += "لا توجد أكواد متاحة حالياً.";
    } else {
      availableCodes.forEach((c: any) => {
        responseText += `🔹 \`${c.code}\`\n`;
      });
    }

    await sendMessage(chatId, responseText, {
      inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "codes_menu" }]],
    }, "Markdown");

    await editMessage(chatId, messageId, "✅ تم عرض الأكواد.", {
      inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "codes_menu" }]],
    });
  } catch (error) {
    console.error("View codes error:", error);
    await editMessage(chatId, messageId, "❌ حدث خطأ.", {
      inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "codes_menu" }]],
    });
  }
}

// دالة إرسال قائمة الإحصائيات
async function sendStatsMenu(chatId: string, messageId: number) {
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

// دوال مساعدة
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