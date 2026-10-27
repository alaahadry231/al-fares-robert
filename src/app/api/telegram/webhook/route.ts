import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { sendTelegramNotification } from "@/lib/telegram";

const ADMIN_ID = "7597432185";

// متغير مؤقت لحفظ حالة البوت (عشان يعرف إنك عم تكتب رسالة جماعية)
// ملاحظة: هاد المتغير بيصفر كل ما يعيد Vercel تشغيل السيرفر (Cold Start)
// بس بيمشي الحال للمهمة السريعة.
let awaitingBroadcast = false;

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

      if (data === "main_menu") {
        awaitingBroadcast = false; // إلغاء حالة البث لو رجع للقائمة
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
      } else if (data.startsWith("ban_")) {
        const playerId = data.split("_")[1];
        await toggleBan(chatId, messageId, parseInt(playerId), true);
      } else if (data.startsWith("unban_")) {
        const playerId = data.split("_")[1];
        await toggleBan(chatId, messageId, parseInt(playerId), false);
      }
      // 👇 زر البث الجماعي
      else if (data === "broadcast_menu") {
        awaitingBroadcast = true;
        await editMessage(chatId, messageId, "📢 *الرسالة الجماعية*\n\nأرسل الآن الرسالة التي تريد إرسالها لجميع اللاعبين:", {
          inline_keyboard: [[{ text: "⬅️ إلغاء", callback_data: "main_menu" }]],
        }, "Markdown");
      }

      return NextResponse.json({ ok: true });
    }

    if (body.message) {
      const message = body.message;
      const chatId = message.chat.id.toString();
      const text = message.text || "";

      if (chatId === ADMIN_ID) {
        // إذا كان المدير يكتب رسالة جماعية
        if (awaitingBroadcast) {
          awaitingBroadcast = false; // صفر الحالة
          await sendBroadcast(chatId, text);
          return NextResponse.json({ ok: true });
        }

        // الأوامر العادية
        if (text === "/admin" || text === "/start") {
          await sendMainMenu(chatId);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}

// دالة إرسال القائمة الرئيسية (مع الزر الجديد)
async function sendMainMenu(chatId: string, messageId?: number) {
  const text = `👋 أهلاً بك يا مدير الموقع!\n\nاختر من القائمة التالية للتحكم بالموقع:`;
  const keyboard = {
    inline_keyboard: [
      [{ text: "🎟️ إدارة الأكواد", callback_data: "codes_menu" }],
      [{ text: "📊 الإحصائيات", callback_data: "stats_menu" }],
      [{ text: "🎁 الجوائز المعلقة", callback_data: "prizes_menu" }],
      [{ text: "👥 إدارة اللاعبين", callback_data: "players_menu" }],
      [{ text: "📢 رسالة جماعية", callback_data: "broadcast_menu" }], // 👈 الزر الجديد
      [{ text: "❌ إغلاق اللوحة", callback_data: "close_menu" }],
    ],
  };
  if (messageId) await editMessage(chatId, messageId, text, keyboard);
  else await sendMessage(chatId, text, keyboard);
}

// دالة تنفيذ البث
async function sendBroadcast(chatId: string, text: string) {
  try {
    await sendMessage(chatId, "⏳ جاري إرسال الرسالة للاعبين... انتظر قليلاً.");

    // 1. جلب كل اللاعبين اللي عندهم chat_id
    const players = await sql`
      select telegram_chat_id from players where telegram_chat_id is not null
    `;

    if (players.length === 0) {
      await sendMessage(chatId, "⚠️ لا يوجد لاعبين مربوطين بالبوت حالياً.");
      return;
    }

    // 2. نرسل الرسالة لكل لاعب
    let successCount = 0;
    for (const player of players) {
      try {
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: player.telegram_chat_id,
            text: text,
            parse_mode: "HTML",
          }),
        });
        successCount++;
      } catch (e) {
        console.error(`Failed to send to ${player.telegram_chat_id}`);
      }
      
      // تأخير بسيط عشان ما يحظر تلغرام البوت
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // 3. تقرير النتيجة للمدير
    await sendMessage(chatId, `✅ *تم إرسال الرسالة بنجاح!*\n\nوصلت لـ ${successCount} لاعب من أصل ${players.length}.`, {
      inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "main_menu" }]],
    }, "Markdown");

  } catch (error) {
    console.error("Broadcast error:", error);
    await sendMessage(chatId, "❌ حدث خطأ أثناء إرسال الرسالة.");
  }
}

// ... (باقي الدوال المساعدة زي ما هي: sendCodesMenu, generateCodes, viewAvailableCodes, sendStatsMenu, sendPrizesMenu, deliverPrize, sendPlayersMenu, toggleBan, sendMessage, editMessage)

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

async function generateCodes(chatId: string, messageId: number, count: number) {
  try {
    const generatedCodes: string[] = [];
    for (let i = 0; i < count; i++) {
      const randomCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      await sql`insert into spin_codes (code, is_used) values (${randomCode}, false)`;
      generatedCodes.push(randomCode);
    }
    let responseText = `✅ تم توليد ${count} كود بنجاح!\n\n` + generatedCodes.join("\n");
    await sendMessage(chatId, `\`\`\`\n${responseText}\n\`\`\``, {
      inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "codes_menu" }]],
    }, "MarkdownV2");
    await editMessage(chatId, messageId, `✅ تم توليد ${count} كود. (شوف الرسالة اللي تحت)`, {
      inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "codes_menu" }]],
    });
  } catch (error) {
    await editMessage(chatId, messageId, "❌ حدث خطأ أثناء توليد الأكواد.", {
      inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "codes_menu" }]],
    });
  }
}

async function viewAvailableCodes(chatId: string, messageId: number) {
  try {
    const availableCodes = await sql`select code from spin_codes where is_used = false limit 20`;
    let responseText = `📋 *الأكواد المتاحة (أول 20)*\n\n`;
    if (availableCodes.length === 0) responseText += "لا توجد أكواد متاحة حالياً.";
    else availableCodes.forEach((c: any) => responseText += `🔹 \`${c.code}\`\n`);

    await sendMessage(chatId, responseText, {
      inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "codes_menu" }]],
    }, "Markdown");
    await editMessage(chatId, messageId, "✅ تم عرض الأكواد.", {
      inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "codes_menu" }]],
    });
  } catch (error) {
    await editMessage(chatId, messageId, "❌ حدث خطأ.", {
      inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "codes_menu" }]],
    });
  }
}

async function sendStatsMenu(chatId: string, messageId: number) {
  const players = await sql`select count(*)::int as count from players`;
  const codes = await sql`select count(*)::int as count from spin_codes where is_used = false`;
  const prizes = await sql`select count(*)::int as count from prizes where status = 'pending'`;
  const text = `📊 *إحصائيات سريعة*\n\n👥 اللاعبين: ${players[0].count}\n🎟️ الأكواد المتاحة: ${codes[0].count}\n🎁 الجوائز المعلقة: ${prizes[0].count}`;
  await editMessage(chatId, messageId, text, {
    inline_keyboard: [
      [{ text: "🔄 تحديث", callback_data: "stats_menu" }],
      [{ text: "⬅️ رجوع", callback_data: "main_menu" }],
    ],
  }, "Markdown");
}

async function sendPrizesMenu(chatId: string, messageId: number) {
  const prizes = await sql`
    select p.id, p.amount, pl.nickname, pl.telegram_chat_id
    from prizes p join players pl on p.player_id = pl.id
    where p.status = 'pending' order by p.created_at asc limit 5
  `;
  let text = `🎁 *الجوائز المعلقة (أول 5)*\n\n`;
  const keyboardRows: any[] = [];
  if (prizes.length === 0) text += "لا توجد جوائز معلقة حالياً.";
  else {
    prizes.forEach((p: any, i: number) => {
      text += `${i + 1}. ${p.nickname} - ${p.amount.toLocaleString("ar-EG")} ل.س\n`;
      keyboardRows.push([{ text: `✅ تسليم جائزة ${p.nickname} (${p.amount})`, callback_data: `deliver_${p.id}` }]);
    });
  }
  keyboardRows.push([{ text: "⬅️ رجوع", callback_data: "main_menu" }]);
  await editMessage(chatId, messageId, text, { inline_keyboard: keyboardRows }, "Markdown");
}

async function deliverPrize(chatId: string, messageId: number, prizeId: number) {
  try {
    const result = await sql`
      update prizes set status = 'delivered', delivered_at = now()
      where id = ${prizeId} and status = 'pending' returning *
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
    await editMessage(chatId, messageId, "❌ حدث خطأ أثناء تسليم الجائزة.", {
      inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "prizes_menu" }]],
    });
  }
}

async function sendPlayersMenu(chatId: string, messageId: number) {
  const players = await sql`select id, nickname, total_points, is_banned from players order by total_points desc limit 5`;
  let text = `👥 *أفضل 5 لاعبين (حسب النقاط)*\n\n`;
  const keyboardRows: any[] = [];
  if (players.length === 0) text += "لا يوجد لاعبين مسجلين حالياً.";
  else {
    players.forEach((p: any, i: number) => {
      const status = p.is_banned ? "🚫 محظور" : "✅ نشط";
      text += `${i + 1}. ${p.nickname} - ${p.total_points.toLocaleString("ar-EG")} نقطة (${status})\n`;
      if (p.is_banned) keyboardRows.push([{ text: `✅ فك الحظر عن ${p.nickname}`, callback_data: `unban_${p.id}` }]);
      else keyboardRows.push([{ text: `🚫 حظر ${p.nickname}`, callback_data: `ban_${p.id}` }]);
    });
  }
  keyboardRows.push([{ text: "⬅️ رجوع", callback_data: "main_menu" }]);
  await editMessage(chatId, messageId, text, { inline_keyboard: keyboardRows }, "Markdown");
}

async function toggleBan(chatId: string, messageId: number, playerId: number, ban: boolean) {
  try {
    await sql`
      update players set is_banned = ${ban}, 
          ban_reason = ${ban ? "حظر من لوحة التحكم (البوت)" : ""},
          ban_until = ${ban ? sql`now() + interval '30 days'` : null}
      where id = ${playerId}
    `;
    await sendPlayersMenu(chatId, messageId);
  } catch (error) {
    await editMessage(chatId, messageId, "❌ حدث خطأ أثناء تنفيذ الإجراء.", {
      inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "players_menu" }]],
    });
  }
}

async function sendMessage(chatId: string, text: string, keyboard?: any, parseMode?: string) {
  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, reply_markup: keyboard, parse_mode: parseMode }),
  });
}

async function editMessage(chatId: string, messageId: number, text: string, keyboard?: any, parseMode?: string) {
  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, reply_markup: keyboard, parse_mode: parseMode }),
  });
}