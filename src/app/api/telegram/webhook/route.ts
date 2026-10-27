import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

const ADMIN_ID = "7597432185";
const ADMIN_USERNAME = "FaresRobert";
const CHANNEL_USERNAME = "@AlFaresRobert";
const BOT_USERNAME = "AlFaresRobert_bot";

let awaitingGiftCode = false;
let tempGiftAmount = 0;
let tempGiftUses = 0;
let awaitingPlayerGiftCode = false;
let adminReplyingToPlayer: string | null = null;

let awaitingBroadcastChoice = false;
let awaitingBroadcastPhoto = false;
let awaitingBroadcastText = false;
let awaitingBroadcastButtonChoice = false;
let awaitingBroadcastButtonText = false;
let awaitingBroadcastButtonUrl = false;

let broadcastPhotoUrl = "";
let broadcastText = "";
let broadcastButtonText = "";
let broadcastButtonUrl = "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

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
          resetBroadcastState();
          await sendAdminMainMenu(chatId, messageId);
        } else if (data === "codes_menu") {
          await sendCodesMenu(chatId, messageId);
        } else if (data === "gift_history_menu") {
          await sendGiftCodesList(chatId, messageId);
        } else if (data.startsWith("gift_details_")) {
          const codeId = data.split("_")[2];
          await sendGiftCodeDetails(chatId, messageId, parseInt(codeId));
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
        } 
        else if (data === "admin_referrals_report") {
          await sendReferralsReport(chatId, messageId);
        } else if (data === "admin_reset_referrals") {
          await editMessage(chatId, messageId, "⚠️ *تأكيد التصفير*\n\nهل أنت متأكد من تصفير جميع الإحالات؟ لا يمكن التراجع!", {
            inline_keyboard: [
              [{ text: "✅ نعم، صفّر", callback_data: "confirm_reset_referrals" }],
              [{ text: "⬅️ إلغاء", callback_data: "main_menu" }],
            ],
          }, "Markdown");
        } else if (data === "confirm_reset_referrals") {
          await sql`update referrals set status = 'cancelled'`;
          await sql`update referral_settings set last_reset_at = now() where id = 1`;
          await sql`delete from pending_referrals`;
          await editMessage(chatId, messageId, "✅ *تم تصفير جميع الإحالات بنجاح!* بدأ عداد جديد لـ 10 أيام.", {
            inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "main_menu" }]],
          }, "Markdown");
        }
        else if (data === "broadcast_menu") {
          awaitingBroadcastChoice = true;
          await editMessage(chatId, messageId, "📢 *الرسالة الجماعية*\n\nهل تريد إرسال صورة مع الرسالة؟", {
            inline_keyboard: [
              [{ text: "🖼️ نعم، أرسل صورة", callback_data: "broadcast_with_photo" }],
              [{ text: "📝 لا، نص فقط", callback_data: "broadcast_text_only" }],
              [{ text: "⬅️ إلغاء", callback_data: "main_menu" }],
            ],
          }, "Markdown");
        } 
        else if (data === "broadcast_with_photo") {
          awaitingBroadcastChoice = false;
          awaitingBroadcastPhoto = true;
          await editMessage(chatId, messageId, "🖼️ *أرسل رابط الصورة الآن:*\n\n(يجب أن يكون رابطاً مباشراً للصورة)", {
            inline_keyboard: [[{ text: "⬅️ إلغاء", callback_data: "main_menu" }]],
          }, "Markdown");
        } 
        else if (data === "broadcast_text_only") {
          awaitingBroadcastChoice = false;
          awaitingBroadcastText = true;
          await editMessage(chatId, messageId, "📝 *أرسل النص الآن:*", {
            inline_keyboard: [[{ text: "⬅️ إلغاء", callback_data: "main_menu" }]],
          }, "Markdown");
        }
        else if (data === "broadcast_add_button") {
          awaitingBroadcastButtonChoice = false;
          awaitingBroadcastButtonText = true;
          await editMessage(chatId, messageId, "✍️ *أرسل نص الزر الآن:*\n\n(مثلاً: اشترك بالقناة)", {
            inline_keyboard: [[{ text: "⬅️ إلغاء", callback_data: "main_menu" }]],
          }, "Markdown");
        }
        else if (data === "broadcast_no_button") {
          awaitingBroadcastButtonChoice = false;
          await sendBroadcastFinal(chatId, messageId);
        }
        else if (data === "gen_10") {
          await generateCodes(chatId, messageId, 10);
        } else if (data === "gen_50") {
          await generateCodes(chatId, messageId, 50);
        } else if (data === "view_codes") {
          await viewAvailableCodes(chatId, messageId);
        }
        else if (data.startsWith("deliver_")) {
          const prizeId = data.split("_")[1];
          await deliverPrize(chatId, messageId, parseInt(prizeId));
        } else if (data.startsWith("ban_")) {
          const playerId = data.split("_")[1];
          await toggleBan(chatId, messageId, parseInt(playerId), true);
        } else if (data.startsWith("unban_")) {
          const playerId = data.split("_")[1];
          await toggleBan(chatId, messageId, parseInt(playerId), false);
        } else if (data.startsWith("reply_to_")) {
          const targetChatId = data.split("_")[2];
          adminReplyingToPlayer = targetChatId;
          await editMessage(chatId, messageId, "✍️ اكتب الرسالة التي تريد إرسالها للاعب الآن:", {
            inline_keyboard: [[{ text: "⬅️ إلغاء", callback_data: "main_menu" }]],
          }, "Markdown");
        } else if (data.startsWith("zero_balance_")) {
          const targetPlayerId = data.split("_")[2];
          await zeroBalance(chatId, messageId, parseInt(targetPlayerId));
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
      else if (data === "my_referrals") {
        await showMyReferrals(chatId, messageId);
      }
      else if (data === "check_subscription") {
        const isSubscribed = await checkSubscription(chatId);
        if (isSubscribed) {
          await sendPlayerMenu(chatId, messageId);
        } else {
          await editMessage(chatId, messageId, `⚠️ لم تشترك بالقناة بعد!\n\nاشترك بالقناة أولاً ثم اضغط "✅ تحقق من الاشتراك".`, {
            inline_keyboard: [
              [{ text: "📢 اشترك بالقناة", url: `https://t.me/${CHANNEL_USERNAME.replace('@', '')}` }],
              [{ text: "✅ تحقق من الاشتراك", callback_data: "check_subscription" }],
            ],
          }, "Markdown");
        }
      }

      return NextResponse.json({ ok: true });
    }

    if (body.message) {
      const message = body.message;
      const chatId = message.chat.id.toString();
      const text = message.text || "";

      // --- المدير ---
      if (chatId === ADMIN_ID) {
        if (adminReplyingToPlayer) {
          const targetId = adminReplyingToPlayer;
          adminReplyingToPlayer = null;
          await sendMessage(targetId, `📩 *رسالة من الإدارة:*\n\n${text}`, {
            inline_keyboard: [[{ text: "💬 الرد على المدير", url: `https://t.me/${ADMIN_USERNAME}` }]],
          }, "Markdown");
          await sendMessage(chatId, "✅ تم إرسال الرسالة للاعب بنجاح.");
          return NextResponse.json({ ok: true });
        }

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
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            await sql`insert into gift_codes (code, amount, max_uses) values (${code}, ${tempGiftAmount}, ${tempGiftUses})`;
            await sendMessage(chatId, `✅ *تم إنشاء الكود بنجاح!*\n\n🎁 الجائزة: ${tempGiftAmount} ل.س\n🔢 عدد المرات: ${tempGiftUses}\n\n🎟️ الكود: \`${code}\`\n\nيمكنك نسخه وإرساله للاعبين.`, {
              inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "main_menu" }]],
            }, "Markdown");
            awaitingGiftCode = false; tempGiftAmount = 0; tempGiftUses = 0;
          }
          return NextResponse.json({ ok: true });
        }

        if (awaitingBroadcastPhoto) {
          awaitingBroadcastPhoto = false;
          broadcastPhotoUrl = text.trim();
          awaitingBroadcastText = true;
          await sendMessage(chatId, "✅ تم حفظ رابط الصورة.\n\n📝 *الآن أرسل النص الذي تريد إرساله:*", {
            inline_keyboard: [[{ text: "⬅️ إلغاء", callback_data: "main_menu" }]],
          }, "Markdown");
          return NextResponse.json({ ok: true });
        }

        if (awaitingBroadcastText) {
          awaitingBroadcastText = false;
          broadcastText = text;
          awaitingBroadcastButtonChoice = true;
          await sendMessage(chatId, "✅ تم حفظ النص.\n\n🔘 *هل تريد إضافة زر مع الرسالة؟*", {
            inline_keyboard: [
              [{ text: "🔗 نعم، أضف زر", callback_data: "broadcast_add_button" }],
              [{ text: "❌ لا، بدون زر", callback_data: "broadcast_no_button" }],
            ],
          }, "Markdown");
          return NextResponse.json({ ok: true });
        }

        if (awaitingBroadcastButtonText) {
          awaitingBroadcastButtonText = false;
          broadcastButtonText = text;
          awaitingBroadcastButtonUrl = true;
          await sendMessage(chatId, "✍️ *أرسل رابط الزر الآن:*\n\n(مثلاً: https://t.me/AlFaresRobert)", {
            inline_keyboard: [[{ text: "⬅️ إلغاء", callback_data: "main_menu" }]],
          }, "Markdown");
          return NextResponse.json({ ok: true });
        }

        if (awaitingBroadcastButtonUrl) {
          awaitingBroadcastButtonUrl = false;
          broadcastButtonUrl = text.trim();
          await sendBroadcastFinal(chatId);
          return NextResponse.json({ ok: true });
        }

        if (text === "/admin" || text === "/start") {
          resetBroadcastState();
          await sendAdminMainMenu(chatId);
        }
        return NextResponse.json({ ok: true });
      }

      // --- اللاعبين ---

      // 👇 ربط الحساب من الموقع (start=player_ID)
      if (text.startsWith("/start player_")) {
        const targetPlayerId = text.replace("/start player_", "").trim();
        
        await sql`
          update players 
          set telegram_chat_id = ${chatId}, updated_at = now()
          where id = ${targetPlayerId}
        `;
        
        await sendMessage(chatId, `✅ *تم ربط حسابك بالبوت بنجاح!*\n\nمن الآن رح توصلك إشعارات الجوائز والتوقعات هنا.`);
      }

      // 👇 التحقق من الإحالة عند دخول لاعب جديد بـ /start ref_123
      if (text.startsWith("/start ref_")) {
        const referrerId = text.replace("/start ref_", "").trim();
        const player = await sql`select id from players where telegram_chat_id = ${chatId}`;
        
        if (player.length > 0) {
          const existing = await sql`select id from referrals where referred_id = ${player[0].id}`;
          if (existing.length === 0 && player[0].id.toString() !== referrerId) {
            await sql`insert into referrals (referrer_id, referred_id) values (${referrerId}, ${player[0].id})`;
          }
        } else {
          // اللاعب مو مربوط، نخزن الإحالة مؤقتاً
          await sql`insert into pending_referrals (referrer_id, referred_chat_id) values (${referrerId}, ${chatId})`;
        }
      }

      const isSubscribed = await checkSubscription(chatId);
      if (!isSubscribed) {
        await sendMessage(chatId, `⚠️ *يجب عليك الاشتراك بالقناة أولاً!*\n\nاشترك بالقناة ثم اضغط "✅ تحقق من الاشتراك" للتمكن من استخدام البوت.`, {
          inline_keyboard: [
            [{ text: "📢 اشترك بالقناة", url: `https://t.me/${CHANNEL_USERNAME.replace('@', '')}` }],
            [{ text: "✅ تحقق من الاشتراك", callback_data: "check_subscription" }],
          ],
        }, "Markdown");
        return NextResponse.json({ ok: true });
      }

      const player = await sql`select id, nickname, wallet_balance, telegram_username from players where telegram_chat_id = ${chatId}`;
      
      if (player.length > 0) {
        // 👇 فحص الإحالات المعلقة (سواء جاء من /start عادي أو ref أو player)
        const pending = await sql`select referrer_id from pending_referrals where referred_chat_id = ${chatId}`;
        if (pending.length > 0) {
          const referrerId = pending[0].referrer_id;
          const existing = await sql`select id from referrals where referred_id = ${player[0].id}`;
          if (existing.length === 0 && player[0].id.toString() !== referrerId.toString()) {
            await sql`insert into referrals (referrer_id, referred_id) values (${referrerId}, ${player[0].id})`;
          }
          await sql`delete from pending_referrals where referred_chat_id = ${chatId}`;
        }

        if (text === "/start" || text.startsWith("/start ref_") || text.startsWith("/start player_")) {
          awaitingPlayerGiftCode = false;
          await sendPlayerMenu(chatId);
        } else if (awaitingPlayerGiftCode) {
          awaitingPlayerGiftCode = false;
          await tryUseGiftCode(chatId, text, player[0].id);
        } else {
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

// ================= دوال الإحالات =================

async function showMyReferrals(chatId: string, messageId: number) {
  const player = await sql`select id from players where telegram_chat_id = ${chatId}`;
  if (player.length === 0) return editMessage(chatId, messageId, "⚠️ حسابك غير مربوط.", { inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "player_menu" }]] });

  const playerId = player[0].id;

  const active = await sql`select count(*)::int as count from referrals where referrer_id = ${playerId} and status = 'active'`;
  const cancelled = await sql`select count(*)::int as count from referrals where referrer_id = ${playerId} and status = 'cancelled'`;

  const settings = await sql`select last_reset_at from referral_settings where id = 1`;
  const lastReset = settings.length > 0 ? new Date(settings[0].last_reset_at) : new Date();
  
  const endDate = new Date(lastReset.getTime() + 10 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();

  let timeLeft = "انتهت المدة";
  if (diff > 0) {
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    timeLeft = `${days} يوم و ${hours} ساعة و ${minutes} دقيقة`;
  }

  const referralLink = `https://t.me/${BOT_USERNAME}?start=ref_${playerId}`;

  const text = `📊 *إحالاتي*\n\n` +
               `🔗 *رابط الإحالة الخاص بك:*\n\`${referralLink}\`\n\n` +
               `👥 *الإحالات النشطة:* ${active[0].count}\n` +
               `🚫 *الإحالات الملغية:* ${cancelled[0].count}\n\n` +
               `⏳ *الوقت المتبقي للتصفير:* ${timeLeft}`;

  await editMessage(chatId, messageId, text, {
    inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "player_menu" }]],
  }, "Markdown");
}

async function sendReferralsReport(chatId: string, messageId: number) {
  const report = await sql`
    select p.nickname, 
           count(case when r.status = 'active' then 1 end)::int as active_count,
           count(case when r.status = 'cancelled' then 1 end)::int as cancelled_count
    from players p
    join referrals r on p.id = r.referrer_id
    group by p.id, p.nickname
    having count(r.id) > 0
    order by active_count desc
  `;

  if (report.length === 0) {
    return editMessage(chatId, messageId, "📊 *تقرير الإحالات*\n\nلا توجد إحالات مسجلة حالياً.", {
      inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "main_menu" }]],
    }, "Markdown");
  }

  let text = `📊 *تقرير الإحالات*\n\n`;
  report.forEach((r: any, i: number) => {
    text += `${i + 1}. *${r.nickname}*\n`;
    text += `   ✅ نشطة: ${r.active_count} | 🚫 ملغية: ${r.cancelled_count}\n`;
  });

  await editMessage(chatId, messageId, text, {
    inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "main_menu" }]],
  }, "Markdown");
}

async function checkSubscription(chatId: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getChatMember`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHANNEL_USERNAME, user_id: chatId }),
    });
    const data = await res.json();
    
    // 👇 نطبع النتيجة عشان نشوف شو صاير
    console.log("Check subscription for", chatId, ":", data);
    
    if (data.ok && (data.result.status === "member" || data.result.status === "administrator" || data.result.status === "creator")) {
      return true;
    }
    return false;
  } catch (error) {
    console.error("Check subscription error:", error);
    return false;
  }
}

// ... (باقي الدوال المساعدة زي ما هي)

async function sendAdminMainMenu(chatId: string, messageId?: number) {
  const text = `👋 أهلاً بك يا مدير الموقع!\n\nاختر من القائمة التالية:`;
  const keyboard = {
    inline_keyboard: [
      [{ text: "🎟️ إدارة الأكواد", callback_data: "codes_menu" }, { text: "🎁 توليد كود هدية", callback_data: "gift_menu" }],
      [{ text: "📜 سجل أكواد الهدايا", callback_data: "gift_history_menu" }, { text: "📊 الإحصائيات", callback_data: "stats_menu" }],
      [{ text: "🎁 الجوائز المعلقة", callback_data: "prizes_menu" }, { text: "👥 إدارة اللاعبين", callback_data: "players_menu" }],
      [{ text: "📢 رسالة جماعية", callback_data: "broadcast_menu" }, { text: "📊 تقرير الإحالات", callback_data: "admin_referrals_report" }],
      [{ text: "🔄 تصفير الإحالات", callback_data: "admin_reset_referrals" }],
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
      [{ text: "➕ توليد 10 أكواد", callback_data: "gen_10" }, { text: "➕ توليد 50 كود", callback_data: "gen_50" }],
      [{ text: "📋 عرض الأكواد المتاحة", callback_data: "view_codes" }],
      [{ text: "⬅️ رجوع", callback_data: "main_menu" }],
    ],
  });
}

async function sendGiftCodesList(chatId: string, messageId: number) {
  const codes = await sql`
    select id, code, amount, max_uses, used_count 
    from gift_codes 
    order by created_at desc 
    limit 10
  `;
  let text = `📜 *سجل أكواد الهدايا (أحدث 10)*\n\n`;
  const keyboardRows: any[] = [];
  if (codes.length === 0) {
    text += "لا توجد أكواد هدايا بعد.";
  } else {
    codes.forEach((c: any, i: number) => {
      text += `🎟️ \`${c.code}\` (${c.used_count}/${c.max_uses} استخدام)\n`;
      keyboardRows.push([{ text: `🔍 عرض تفاصيل ${c.code}`, callback_data: `gift_details_${c.id}` }]);
    });
  }
  keyboardRows.push([{ text: "⬅️ رجوع", callback_data: "main_menu" }]);
  await editMessage(chatId, messageId, text, { inline_keyboard: keyboardRows }, "Markdown");
}

async function sendGiftCodeDetails(chatId: string, messageId: number, codeId: number) {
  try {
    const codeInfo = await sql`select * from gift_codes where id = ${codeId}`;
    if (codeInfo.length === 0) return editMessage(chatId, messageId, "⚠️ الكود غير موجود.", { inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "gift_history_menu" }]] });
    const code = codeInfo[0];
    const history = await sql`
      select h.used_at, p.nickname, p.telegram_username 
      from gift_code_history h
      join players p on h.player_id = p.id
      where h.code_id = ${codeId}
      order by h.used_at desc
    `;
    let text = `🎟️ *تفاصيل الكود:* \`${code.code}\`\n\n`;
    text += `💰 *قيمة الهدية:* ${code.amount} ل.س\n`;
    text += `🔢 *الحد الأقصى للاستخدام:* ${code.max_uses}\n`;
    text += `✅ *تم استخدامه:* ${code.used_count} مرة\n\n`;
    text += `👥 *المستخدمون:*\n`;
    const keyboardRows: any[] = [];
    if (history.length === 0) {
      text += "لا أحد استخدم هذا الكود بعد.";
    } else {
      history.forEach((h: any, i: number) => {
        const date = new Date(h.used_at).toLocaleString("ar-EG", { timeZone: "Asia/Damascus", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
        const usernameDisplay = h.telegram_username ? ` (@${h.telegram_username})` : "";
        text += `${i + 1}. ${h.nickname}${usernameDisplay} - ${date}\n`;
        if (h.telegram_username) {
          keyboardRows.push([{ text: `💬 تواصل مع ${h.nickname}`, url: `https://t.me/${h.telegram_username}` }]);
        }
      });
    }
    keyboardRows.push([{ text: "⬅️ رجوع للسجل", callback_data: "gift_history_menu" }]);
    await editMessage(chatId, messageId, text, { inline_keyboard: keyboardRows }, "Markdown");
  } catch (error) {
    console.error("Gift details error:", error);
    await editMessage(chatId, messageId, "❌ حدث خطأ.", { inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "gift_history_menu" }]] });
  }
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
    await sendMessage(chatId, `\`\`\`\n${responseText}\n\`\`\``, { inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "codes_menu" }]] }, "MarkdownV2");
    await editMessage(chatId, messageId, `✅ تم توليد ${count} كود. (شوف الرسالة اللي تحت)`, { inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "codes_menu" }]] });
  } catch (error) {
    await editMessage(chatId, messageId, "❌ حدث خطأ.", { inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "codes_menu" }]] });
  }
}

async function viewAvailableCodes(chatId: string, messageId: number) {
  try {
    const availableCodes = await sql`select code from spin_codes where is_used = false limit 20`;
    let responseText = `📋 *الأكواد المتاحة (أول 20)*\n\n`;
    if (availableCodes.length === 0) responseText += "لا توجد أكواد متاحة حالياً.";
    else availableCodes.forEach((c: any) => responseText += `🔹 \`${c.code}\`\n`);
    await sendMessage(chatId, responseText, { inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "codes_menu" }]] }, "Markdown");
    await editMessage(chatId, messageId, "✅ تم عرض الأكواد.", { inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "codes_menu" }]] });
  } catch (error) {
    await editMessage(chatId, messageId, "❌ حدث خطأ.", { inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "codes_menu" }]] });
  }
}

async function sendBroadcastFinal(chatId: string, messageId?: number) {
  try {
    const buttonKeyboard = broadcastButtonText && broadcastButtonUrl ? {
      inline_keyboard: [[{ 
        text: broadcastButtonText, 
        url: broadcastButtonUrl,
        style: "primary"
      }]]
    } : undefined;

    if (messageId) {
      await editMessage(chatId, messageId, "⏳ جاري إرسال الرسالة...", { inline_keyboard: [] });
    } else {
      await sendMessage(chatId, "⏳ جاري إرسال الرسالة للاعبين... انتظر قليلاً.");
    }

    const players = await sql`select telegram_chat_id from players where telegram_chat_id is not null`;
    if (players.length === 0) {
      resetBroadcastState();
      return await sendMessage(chatId, "⚠️ لا يوجد لاعبين مربوطين بالبوت حالياً.");
    }

    let successCount = 0;
    for (const player of players) {
      try {
        if (broadcastPhotoUrl) {
          await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: player.telegram_chat_id, photo: broadcastPhotoUrl, caption: broadcastText, parse_mode: "HTML", reply_markup: buttonKeyboard }),
          });
        } else {
          await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: player.telegram_chat_id, text: broadcastText, parse_mode: "HTML", reply_markup: buttonKeyboard }),
          });
        }
        successCount++;
      } catch (e) { console.error(`Failed to send to ${player.telegram_chat_id}`); }
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    resetBroadcastState();
    await sendMessage(chatId, `✅ *تم إرسال الرسالة بنجاح!*\n\nوصلت لـ ${successCount} لاعب من أصل ${players.length}.`, {
      inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "main_menu" }]],
    }, "Markdown");
  } catch (error) {
    console.error("Broadcast error:", error);
    resetBroadcastState();
    await sendMessage(chatId, "❌ حدث خطأ أثناء إرسال الرسالة.");
  }
}

function resetBroadcastState() {
  awaitingBroadcastChoice = false;
  awaitingBroadcastPhoto = false;
  awaitingBroadcastText = false;
  awaitingBroadcastButtonChoice = false;
  awaitingBroadcastButtonText = false;
  awaitingBroadcastButtonUrl = false;
  broadcastPhotoUrl = "";
  broadcastText = "";
  broadcastButtonText = "";
  broadcastButtonUrl = "";
}

async function sendStatsMenu(chatId: string, messageId: number) {
  const players = await sql`select count(*)::int as count from players`;
  const codes = await sql`select count(*)::int as count from spin_codes where is_used = false`;
  const prizes = await sql`select count(*)::int as count from prizes where status = 'pending'`;
  const text = `📊 *إحصائيات سريعة*\n\n👥 اللاعبين: ${players[0].count}\n🎟️ الأكواد المتاحة: ${codes[0].count}\n🎁 الجوائز المعلقة: ${prizes[0].count}`;
  await editMessage(chatId, messageId, text, { inline_keyboard: [[{ text: "🔄 تحديث", callback_data: "stats_menu" }], [{ text: "⬅️ رجوع", callback_data: "main_menu" }]] }, "Markdown");
}

async function sendPrizesMenu(chatId: string, messageId: number) {
  const prizes = await sql`select p.id, p.amount, pl.nickname from prizes p join players pl on p.player_id = pl.id where p.status = 'pending' order by p.created_at asc limit 5`;
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

async function sendPlayerMenu(chatId: string, messageId?: number) {
  const text = `👋 أهلاً بك في Al Fares Robert!\n\nاختر من القائمة:`;
  const keyboard = {
    inline_keyboard: [
      [{ text: "🎁 إدخال كود هدية", callback_data: "enter_gift_code" }, { text: "💰 رصيدي", callback_data: "check_balance" }],
      [{ text: "💸 استلام الرصيد", callback_data: "redeem_balance" }, { text: "📊 إحالاتي", callback_data: "my_referrals" }],
    ],
  };
  if (messageId) await editMessage(chatId, messageId, text, keyboard);
  else await sendMessage(chatId, text, keyboard);
}

async function showPlayerBalance(chatId: string, messageId: number) {
  const player = await sql`select wallet_balance from players where telegram_chat_id = ${chatId}`;
  if (player.length === 0) return editMessage(chatId, messageId, "⚠️ حسابك غير مربوط.", { inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "player_menu" }]] });
  await editMessage(chatId, messageId, `💰 *رصيدك الحالي هو:* ${player[0].wallet_balance.toLocaleString("ar-EG")} ل.س`, { inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "player_menu" }]] }, "Markdown");
}

async function requestRedeem(chatId: string, messageId: number) {
  const player = await sql`select id, nickname, wallet_balance, telegram_username, telegram_chat_id from players where telegram_chat_id = ${chatId}`;
  if (player.length === 0) return editMessage(chatId, messageId, "⚠️ حسابك غير مربوط.", { inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "player_menu" }]] });
  const balance = player[0].wallet_balance;
  if (balance <= 0) return editMessage(chatId, messageId, "⚠️ رصيدك صفر، لا يمكنك طلب الاستلام.", { inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "player_menu" }]] });
  const keyboardForAdmin: any[] = [];
  if (player[0].telegram_username) {
    keyboardForAdmin.push([{ text: "💬 تواصل مع اللاعب (مباشر)", url: `https://t.me/${player[0].telegram_username}` }]);
  } else {
    keyboardForAdmin.push([{ text: "📩 أرسل رسالة للاعب", callback_data: `reply_to_${player[0].telegram_chat_id}` }]);
  }
  keyboardForAdmin.push([{ text: "✅ تم التسليم (تصفير الرصيد)", callback_data: `zero_balance_${player[0].id}` }]);
  await sendMessage(ADMIN_ID, `💸 <b>طلب استلام رصيد جديد!</b>\n\n👤 اللاعب: ${player[0].nickname}\n💰 الرصيد: ${balance.toLocaleString("ar-EG")} ل.س`, { inline_keyboard: keyboardForAdmin }, "HTML");
  await sendMessage(chatId, `✅ *تم إرسال طلبك للمدير!*\n\nسيتم تحويل مبلغ ${balance.toLocaleString("ar-EG")} ل.س إليك قريباً.`, { inline_keyboard: [[{ text: "💬 تواصل مع المدير", url: `https://t.me/${ADMIN_USERNAME}` }], [{ text: "⬅️ رجوع", callback_data: "player_menu" }]] }, "Markdown");
}

async function zeroBalance(chatId: string, messageId: number, playerId: number) {
  try {
    const player = await sql`select telegram_chat_id, nickname, wallet_balance from players where id = ${playerId}`;
    if (player.length === 0) return editMessage(chatId, messageId, "⚠️ اللاعب غير موجود.", { inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "main_menu" }]] });
    const p = player[0];
    await sql`update players set wallet_balance = 0 where id = ${playerId}`;
    if (p.telegram_chat_id) {
      await sendMessage(p.telegram_chat_id, `✅ *تم تسليم رصيدك بنجاح!*\n\n💰 المبلغ: ${p.wallet_balance.toLocaleString("ar-EG")} ل.س\n\nشكراً لتعاملك معنا! 🎉`);
    }
    await editMessage(chatId, messageId, `✅ *تم تصفير رصيد اللاعب ${p.nickname} بنجاح!*`, { inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "main_menu" }]] }, "Markdown");
  } catch (error) {
    await editMessage(chatId, messageId, "❌ حدث خطأ.", { inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "main_menu" }]] });
  }
}

async function tryUseGiftCode(chatId: string, code: string, playerId: number) {
  try {
    const upperCode = code.trim().toUpperCase();
    const giftCode = await sql`select * from gift_codes where code = ${upperCode}`;
    if (giftCode.length === 0) return sendMessage(chatId, "❌ الكود غير صحيح. تأكد منه وحاول مرة تانية.", { inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "player_menu" }]] });
    const gc = giftCode[0];
    if (gc.used_count >= gc.max_uses) return sendMessage(chatId, "⚠️ هذا الكود استنفذ عدد مرات استخدامه.", { inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "player_menu" }]] });
    const history = await sql`select * from gift_code_history where code_id = ${gc.id} and player_id = ${playerId}`;
    if (history.length > 0) return sendMessage(chatId, "⚠️ لقد استخدمت هذا الكود من قبل!", { inline_keyboard: [[{ text: "⬅️ رجوع", callback_data: "player_menu" }]] });
    await sql`update players set wallet_balance = wallet_balance + ${gc.amount} where id = ${playerId}`;
    await sql`update gift_codes set used_count = used_count + 1 where id = ${gc.id}`;
    await sql`insert into gift_code_history (code_id, player_id) values (${gc.id}, ${playerId})`;
    await sendMessage(chatId, `🎉 *مبروك!*\n\nتمت إضافة ${gc.amount.toLocaleString("ar-EG")} ل.س إلى رصيدك.`, { inline_keyboard: [[{ text: "💰 عرض رصيدي", callback_data: "check_balance" }]] }, "Markdown");
  } catch (error) {
    await sendMessage(chatId, "❌ حدث خطأ أثناء تفعيل الكود.");
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