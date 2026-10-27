import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { sendTelegramNotification } from "@/lib/telegram";

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
      } else if (data === "players_menu") {
        await sendPlayersMenu(chatId, messageId);
      } else if (data === "close_menu") {
        await editMessage(chatId, messageId, "✅ تم إغلاق لوحة التحكم.");
      } else if (data === "gen_10") {
        await generateCodes(chatId, messageId, 10);
      } else if (data === "gen_50") {
        await generateCodes(chatId, messageId, 50);
      } else if (data === "view_codes") {
        await viewAvailableCodes(chatId, messageId);
      } else if (data.startsWith("deliver_")) {
        const prizeId = data.split("_")[1];
        await deliverPrize(chatId, messageId, parseInt(prizeId));
      }
      // 👇 أزرار إدارة اللاعبين
      else if (data.startsWith("ban_")) {
        const playerId = data.split("_")[1];
        await toggleBan(chatId, messageId, parseInt(playerId), true);
      } else if (data.startsWith("unban_")) {
        const playerId = data.split("_")[1];
        await toggleBan(chatId, messageId, parseInt(playerId), false);
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
      [{ text: "👥 إدارة اللاعبين", callback_data: "players_menu" }],
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
    
    for (let i = 0; i < count; i++) {
      const randomCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      await sql`
        insert into spin_codes (code, is_used) 
        values (${randomCode}, false)
      `;
      generatedCodes.push(randomCode);
    }

    let responseText = `✅ تم توليد ${count} كود بنجاح!\n\n`;
    responseText += generatedCodes.join("\n");
    
    await sendMessage(chatId, `\`\`\`\n${responseText}\n\`\`\``, {
      inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "codes_menu" }]],
    }, "MarkdownV2");

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

// دالة إرسال قائمة الجوائز (مع زر تسليم لكل جائزة)
async function sendPrizesMenu(chatId: string, messageId: number) {
  const prizes = await sql`
    select p.id, p.amount, pl.nickname, pl.telegram_chat_id
    from prizes p
    join players pl on p.player_id = pl.id
    where p.status = 'pending'
    order by p.created_at asc
    limit 5
  `;

  let text = `🎁 *الجوائز المعلقة (أول 5)*\n\n`;
  
  const keyboardRows: any[] = [];

  if (prizes.length === 0) {
    text += "لا توجد جوائز معلقة حالياً.";
  } else {
    prizes.forEach((p: any, i: number) => {
      text += `${i + 1}. ${p.nickname} - ${p.amount.toLocaleString("ar-EG")} ل.س\n`;
      keyboardRows.push([
        { text: `✅ تسليم جائزة ${p.nickname} (${p.amount})`, callback_data: `deliver_${p.id}` }
      ]);
    });
  }

  keyboardRows.push([{ text: "⬅️ رجوع", callback_data: "main_menu" }]);

  await editMessage(chatId, messageId, text, { inline_keyboard: keyboardRows }, "Markdown");
}

// دالة تسليم الجائزة
async function deliverPrize(chatId: string, messageId: number, prizeId: number) {
  try {
    const result = await sql`
      update prizes 
      set status = 'delivered', delivered_at = now()
      where id = ${prizeId} and status = 'pending'
      returning *
    `;

    if (result.length === 0) {
      await editMessage(chatId, messageId, "⚠️ هذه الجائزة تم تسليمها مسبقاً أو غير موجودة.", {
        inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "prizes_menu" }]],
      });
      return;
    }

    const prize = result[0];
    const player = await sql`select telegram_chat_id, nickname from players where id = ${prize.player_id}`;
    
    if (player.length > 0 && player[0].telegram_chat_id) {
      await sendTelegramNotification(
        `✅ <b>تم تسليم جائزتك!</b>\n\n👤 ${player[0].nickname}\n💰 المبلغ: ${prize.amount.toLocaleString("ar-EG")} ل.س\n\nشكراً لمشاركتك معنا! 🎉`,
        player[0].telegram_chat_id
      );
    }

    await sendPrizesMenu(chatId, messageId);

  } catch (error) {
    console.error("Deliver prize error:", error);
    await editMessage(chatId, messageId, "❌ حدث خطأ أثناء تسليم الجائزة.", {
      inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "prizes_menu" }]],
    });
  }
}

// 👇 دالة إرسال قائمة اللاعبين
async function sendPlayersMenu(chatId: string, messageId: number) {
  const players = await sql`
    select id, nickname, total_points, is_banned 
    from players 
    order by total_points desc
    limit 5
  `;

  let text = `👥 *أفضل 5 لاعبين (حسب النقاط)*\n\n`;
  
  const keyboardRows: any[] = [];

  if (players.length === 0) {
    text += "لا يوجد لاعبين مسجلين حالياً.";
  } else {
    players.forEach((p: any, i: number) => {
      const status = p.is_banned ? "🚫 محظور" : "✅ نشط";
      text += `${i + 1}. ${p.nickname} - ${p.total_points.toLocaleString("ar-EG")} نقطة (${status})\n`;
      
      if (p.is_banned) {
        keyboardRows.push([
          { text: `✅ فك الحظر عن ${p.nickname}`, callback_data: `unban_${p.id}` }
        ]);
      } else {
        keyboardRows.push([
          { text: `🚫 حظر ${p.nickname}`, callback_data: `ban_${p.id}` }
        ]);
      }
    });
  }

  keyboardRows.push([{ text: "⬅️ رجوع", callback_data: "main_menu" }]);

  await editMessage(chatId, messageId, text, { inline_keyboard: keyboardRows }, "Markdown");
}

// 👇 دالة حظر/فك حظر لاعب
async function toggleBan(chatId: string, messageId: number, playerId: number, ban: boolean) {
  try {
    await sql`
      update players 
      set is_banned = ${ban}, 
          ban_reason = ${ban ? "حظر من لوحة التحكم (البوت)" : ""},
          ban_until = ${ban ? sql`now() + interval '30 days'` : null}
      where id = ${playerId}
    `;

    // تحديث القائمة
    await sendPlayersMenu(chatId, messageId);

  } catch (error) {
    console.error("Ban error:", error);
    await editMessage(chatId, messageId, "❌ حدث خطأ أثناء تنفيذ الإجراء.", {
      inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "players_menu" }]],
    });
  }
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