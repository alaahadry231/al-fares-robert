import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { sendTelegramNotification } from "@/lib/telegram";

const ADMIN_ID = "7597432185";
const ADMIN_USERNAME = "FaresRobert"; // 👈 معرف حسابك الشخصي لاستلام الرصيد

// متغيرات لحفظ حالة المدير (عشان يعرف إنه عم يولد كود)
let awaitingGiftCode = false;
let tempGiftAmount = 0;
let tempGiftUses = 0;

// متغير لحفظ حالة اللاعب (عشان يعرف إنه عم يدخل كود هدية)
let awaitingPlayerGiftCode = false;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. معالجة الأزرار (Callbacks)
    if (body.callback_query) {
      const callbackQuery = body.callback_query;
      const chatId = callbackQuery.message.chat.id.toString();
      const messageId = callbackQuery.message.message_id;
      const data = callbackQuery.data;

      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: callbackQuery.id }),
      });

      // --- أوامر المدير ---
      if (chatId === ADMIN_ID) {
        if (data === "main_menu") {
          awaitingGiftCode = false;
          await sendAdminMainMenu(chatId, messageId);
        } else if (data === "codes_menu") {
          await sendCodesMenu(chatId, messageId);
        } else if (data === "stats_menu") {
          await sendStatsMenu(chatId, messageId);
        } else if (data === "prizes_menu") {
          await sendPrizesMenu(chatId, messageId);
        } else if (data === "players_menu") {
          await sendPlayersMenu(chatId, messageId);
        } else if (data === "gift_menu") {
          awaitingGiftCode = true;
          tempGiftAmount = 0;
          tempGiftUses = 0;
          await editMessage(chatId, messageId, "🎁 *توليد كود هدية*\n\nأرسل لي قيمة الجائزة (مثلاً: 5000):", {
            inline_keyboard: [[{ text: "⬅️ إلغاء", callback_data: "main_menu" }]],
          }, "Markdown");
        } else if (data === "broadcast_menu") {
          // كود البث القديم
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
        return NextResponse.json({ ok: true });
      }

      // --- أوامر اللاعبين ---
      if (data === "player_menu") {
        awaitingPlayerGiftCode = false;
        await sendPlayerMenu(chatId, messageId);
      } else if (data === "check_balance") {
        await showPlayerBalance(chatId, messageId);
      } else if (data === "redeem_balance") {
        await requestRedeem(chatId, messageId);
      } else if (data === "enter_gift_code") {
        awaitingPlayerGiftCode = true;
        await editMessage(chatId, messageId, "🎁 *كود الهدية*\n\nأرسل لي كود الهدية الآن:", {
          inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "player_menu" }]],
        }, "Markdown");
      }

      return NextResponse.json({ ok: true });
    }

    // 2. معالجة الرسائل النصية
    if (body.message) {
      const message = body.message;
      const chatId = message.chat.id.toString();
      const text = message.text || "";

      // --- المدير ---
      if (chatId === ADMIN_ID) {
        if (awaitingGiftCode) {
          if (tempGiftAmount === 0) {
            const amount = parseInt(text);
            if (isNaN(amount)) return sendMessage(chatId, "⚠️ أرسل رقم صحيح.");
            tempGiftAmount = amount;
            await sendMessage(chatId, "🔢 كم مرة يمكن استخدام الكود؟ (مثلاً: 1):");
          } else {
            const uses = parseInt(text);
            if (isNaN(uses)) return sendMessage(chatId, "⚠️ أرسل رقم صحيح.");
            tempGiftUses = uses;

            // توليد الكود
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            await sql`insert into gift_codes (code, amount, max_uses) values (${code}, ${tempGiftAmount}, ${tempGiftUses})`;
            
            await sendMessage(chatId, `✅ *تم إنشاء الكود بنجاح!*\n\n🎁 الجائزة: ${tempGiftAmount} ل.س\n🔢 عدد المرات: ${tempGiftUses}\n\n🎟️ الكود: \`${code}\`\n\nيمكنك نسخه وإرساله للاعبين.`, {
              inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "main_menu" }]],
            }, "Markdown");
            
            awaitingGiftCode = false; tempGiftAmount = 0; tempGiftUses = 0;
          }
          return NextResponse.json({ ok: true });
        }
        if (text === "/admin" || text === "/start") {
          awaitingGiftCode = false;
          await sendAdminMainMenu(chatId);
        }
        return NextResponse.json({ ok: true });
      }

      // --- اللاعبين ---
      const player = await sql`select id, nickname, wallet_balance from players where telegram_chat_id = ${chatId}`;
      
      if (player.length > 0) {
        if (text === "/start") {
          // عرض القائمة الرئيسية للاعب
          awaitingPlayerGiftCode = false;
          await sendPlayerMenu(chatId);
        } else if (awaitingPlayerGiftCode) {
          // إذا كان اللاعب في وضع إدخال الكود
          awaitingPlayerGiftCode = false; // صفر الحالة بعد المحاولة
          await tryUseGiftCode(chatId, text, player[0].id);
        } else {
          // أي رسالة تانية، نعتبرها محاولة كود مباشرة (اختياري)
          await tryUseGiftCode(chatId, text, player[0].id);
        }
      } else {
        await sendMessage(chatId, "⚠️ يجب عليك ربط حسابك بالموقع أولاً لتتمكن من استخدام البوت.");
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}

// ================= دوال المدير =================

async function sendAdminMainMenu(chatId: string, messageId?: number) {
  const text = `👋 أهلاً بك يا مدير الموقع!\n\nاختر من القائمة التالية:`;
  const keyboard = {
    inline_keyboard: [
      [{ text: "🎟️ إدارة الأكواد", callback_data: "codes_menu" }],
      [{ text: "🎁 توليد كود هدية", callback_data: "gift_menu" }],
      [{ text: "📊 الإحصائيات", callback_data: "stats_menu" }],
      [{ text: "🎁 الجوائز المعلقة", callback_data: "prizes_menu" }],
      [{ text: "👥 إدارة اللاعبين", callback_data: "players_menu" }],
      [{ text: "📢 رسالة جماعية", callback_data: "broadcast_menu" }],
      [{ text: "❌ إغلاق اللوحة", callback_data: "close_menu" }],
    ],
  };
  if (messageId) await editMessage(chatId, messageId, text, keyboard);
  else await sendMessage(chatId, text, keyboard);
}

async function sendCodesMenu(chatId: string, messageId: number) {
  const text = `🎟️ *إدارة الأكواد*\n\nاختر الإجراء اللي بدك ياه:`;
  await editMessage(chatId, messageId, text, {
    inline_keyboard: [
      [{ text: "➕ توليد 10 أكواد", callback_data: "gen_10" }],
      [{ text: "➕ توليد 50 كود", callback_data: "gen_50" }],
      [{ text: "📋 عرض الأكواد المتاحة", callback_data: "view_codes" }],
      [{ text: "⬅️ رجوع", callback_data: "main_menu" }],
    ],
  });
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
    await editMessage(chatId, messageId, `✅ تم توليد ${count} كود.`, {
      inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "codes_menu" }]],
    });
  } catch (error) {
    await editMessage(chatId, messageId, "❌ حدث خطأ.", {
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
    select p.id, p.amount, pl.nickname from prizes p join players pl on p.player_id = pl.id
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
    const result = await sql`update prizes set status = 'delivered', delivered_at = now() where id = ${prizeId} and status = 'pending' returning *`;
    if (result.length === 0) return editMessage(chatId, messageId, "⚠️ الجائزة غير موجودة.", { inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "prizes_menu" }]] });
    await sendPrizesMenu(chatId, messageId);
  } catch { await editMessage(chatId, messageId, "❌ خطأ.", { inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "prizes_menu" }]] }); }
}

async function sendPlayersMenu(chatId: string, messageId: number) {
  const players = await sql`select id, nickname, total_points, is_banned from players order by total_points desc limit 5`;
  let text = `👥 *أفضل 5 لاعبين*\n\n`;
  const keyboardRows: any[] = [];
  if (players.length === 0) text += "لا يوجد لاعبين.";
  else {
    players.forEach((p: any, i: number) => {
      const status = p.is_banned ? "🚫" : "✅";
      text += `${i + 1}. ${p.nickname} - ${p.total_points.toLocaleString("ar-EG")} نقطة (${status})\n`;
      if (p.is_banned) keyboardRows.push([{ text: `✅ فك الحظر عن ${p.nickname}`, callback_data: `unban_${p.id}` }]);
      else keyboardRows.push([{ text: `🚫 حظر ${p.nickname}`, callback_data: `ban_${p.id}` }]);
    });
  }
  keyboardRows.push([{ text: "⬅️ رجوع", callback_data: "main_menu" }]);
  await editMessage(chatId, messageId, text, { inline_keyboard: keyboardRows }, "Markdown");
}

async function toggleBan(chatId: string, messageId: number, playerId: number, ban: boolean) {
  await sql`update players set is_banned = ${ban}, ban_reason = ${ban ? "حظر" : ""}, ban_until = ${ban ? sql`now() + interval '30 days'` : null} where id = ${playerId}`;
  await sendPlayersMenu(chatId, messageId);
}

// ================= دوال اللاعبين =================

async function sendPlayerMenu(chatId: string, messageId?: number) {
  const text = `👋 أهلاً بك في Al Fares Robert!\n\nاختر من القائمة:`;
  const keyboard = {
    inline_keyboard: [
      [{ text: "🎁 إدخال كود هدية", callback_data: "enter_gift_code" }],
      [{ text: "💰 رصيدي", callback_data: "check_balance" }],
      [{ text: "💸 استلام الرصيد", callback_data: "redeem_balance" }],
    ],
  };
  if (messageId) await editMessage(chatId, messageId, text, keyboard);
  else await sendMessage(chatId, text, keyboard);
}

async function showPlayerBalance(chatId: string, messageId: number) {
  const player = await sql`select wallet_balance from players where telegram_chat_id = ${chatId}`;
  if (player.length === 0) return editMessage(chatId, messageId, "⚠️ حسابك غير مربوط.", { inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "player_menu" }]] });
  
  await editMessage(chatId, messageId, `💰 *رصيدك الحالي هو:* ${player[0].wallet_balance.toLocaleString("ar-EG")} ل.س`, {
    inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "player_menu" }]],
  }, "Markdown");
}

async function requestRedeem(chatId: string, messageId: number) {
  const player = await sql`select id, nickname, wallet_balance from players where telegram_chat_id = ${chatId}`;
  if (player.length === 0) return editMessage(chatId, messageId, "⚠️ حسابك غير مربوط.", { inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "player_menu" }]] });
  
  const balance = player[0].wallet_balance;
  if (balance <= 0) {
    return editMessage(chatId, messageId, "⚠️ رصيدك صفر، لا يمكنك طلب الاستلام.", { inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "player_menu" }]] });
  }

  // إرسال إشعار للمدير
  await sendTelegramNotification(
    `💸 <b>طلب استلام رصيد جديد!</b>\n\n👤 اللاعب: ${player[0].nickname}\n💰 الرصيد: ${balance.toLocaleString("ar-EG")} ل.س\n\nاضغط على الرابط للتواصل: @${ADMIN_USERNAME}`
  );

  // إرسال رسالة للاعب مع زر التواصل
  await sendMessage(chatId, `✅ *تم إرسال طلبك للمدير!*\n\nسيتم تحويل مبلغ ${balance.toLocaleString("ar-EG")} ل.س إليك قريباً. للتواصل المباشر اضغط على الزر بالأسفل:`, {
    inline_keyboard: [
      [{ text: "💬 تواصل مع المدير على تلغرام", url: `https://t.me/${ADMIN_USERNAME}` }],
      [{ text: "⬅️ رجوع", callback_data: "player_menu" }],
    ],
  }, "Markdown");

  // تصفير الرصيد بعد الطلب (عشان ما يطلب مرتين)
  await sql`update players set wallet_balance = 0 where id = ${player[0].id}`;
}

async function tryUseGiftCode(chatId: string, code: string, playerId: number) {
  try {
    const upperCode = code.trim().toUpperCase();
    
    // 1. البحث عن الكود
    const giftCode = await sql`select * from gift_codes where code = ${upperCode}`;
    if (giftCode.length === 0) {
      return sendMessage(chatId, "❌ الكود غير صحيح. تأكد منه وحاول مرة تانية.", {
        inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "player_menu" }]],
      });
    }

    const gc = giftCode[0];

    // 2. التأكد من صلاحية الكود
    if (gc.used_count >= gc.max_uses) {
      return sendMessage(chatId, "⚠️ هذا الكود استنفذ عدد مرات استخدامه.", {
        inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "player_menu" }]],
      });
    }

    // 3. التأكد إنه اللاعب ما استخدم هالكود قبل هيك
    const history = await sql`select * from gift_code_history where code_id = ${gc.id} and player_id = ${playerId}`;
    if (history.length > 0) {
      return sendMessage(chatId, "⚠️ لقد استخدمت هذا الكود من قبل!", {
        inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "player_menu" }]],
      });
    }

    // 4. إضافة الرصيد وتحديث الكود
    await sql`update players set wallet_balance = wallet_balance + ${gc.amount} where id = ${playerId}`;
    await sql`update gift_codes set used_count = used_count + 1 where id = ${gc.id}`;
    await sql`insert into gift_code_history (code_id, player_id) values (${gc.id}, ${playerId})`;

    await sendMessage(chatId, `🎉 *مبروك!*\n\nتمت إضافة ${gc.amount.toLocaleString("ar-EG")} ل.س إلى رصيدك.`, {
      inline_keyboard: [[{ text: "💰 عرض رصيدي", callback_data: "check_balance" }]],
    }, "Markdown");

  } catch (error) {
    console.error("Gift code error:", error);
    await sendMessage(chatId, "❌ حدث خطأ أثناء تفعيل الكود.");
  }
}

// ================= دوال مساعدة =================
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