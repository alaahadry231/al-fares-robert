import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { sendTelegramNotification } from "@/lib/telegram";
import { waitUntil } from "@vercel/functions";

function pickPrize() {
  const prizes = [
    { type: "lose", amount: 0, weight: 40, label: "حظ أوفر" },
    { type: "retry", amount: 0, weight: 20, label: "محاولة أخرى" },
    { type: "win", amount: 5000, weight: 20, label: "5,000 ل.س" },
    { type: "win", amount: 10000, weight: 10, label: "10,000 ل.س" },
    { type: "win", amount: 15000, weight: 5, label: "15,000 ل.س" },
    { type: "win", amount: 25000, weight: 2.5, label: "25,000 ل.س" },
    { type: "win", amount: 50000, weight: 1.5, label: "50,000 ل.س" },
    { type: "win", amount: 75000, weight: 0.7, label: "75,000 ل.س" },
    { type: "win", amount: 100000, weight: 0.3, label: "100,000 ل.س" },
  ];

  const total = prizes.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * total;

  for (const prize of prizes) {
    if (random < prize.weight) return prize;
    random -= prize.weight;
  }
  return prizes[0];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, player_id } = body;

    if (!code) {
      return NextResponse.json({ error: "الكود مطلوب" }, { status: 400 });
    }

    if (!player_id) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    const trimmedCode = code.trim().toUpperCase();

    // ✅ 1. فحص أولي سريع (عشان نعطي رسالة خطأ واضحة إذا الكود مستخدم من قبل)
    const existing = await sql`
      select id, is_used from spin_codes where code = ${trimmedCode} limit 1
    `;

    if (existing.length === 0) {
      return NextResponse.json({ error: "الكود غير صحيح" }, { status: 404 });
    }

    if (existing[0].is_used) {
      return NextResponse.json({ error: "هذا الكود مستخدم من قبل" }, { status: 400 });
    }

    const codeId = existing[0].id;
    const prize = pickPrize();

    // جلب بيانات اللاعب
    const playerData = await sql`
      select nickname, telegram_username, telegram_chat_id from players where id = ${player_id} limit 1
    `;

    // ✅ 2. الحماية القصوى (Atomic Update):
    // إذا الجائزة مو "محاولة أخرى"، منحاول نقفل الكود فوراً بشرط إنه يكون مش مستخدم.
    // إذا رجعت بيانات، معناها إحنا أول من استخدمه (آمن).
    // إذا رجعت فاضية، معناها في طلب تاني سبقنا بـ 0.001 ثانية (تم اعتراضه).
    
    if (prize.type !== "retry") {
      const updateResult = await sql`
        update spin_codes
        set is_used = true,
            used_at = now(),
            prize_won = ${prize.label},
            prize_type = ${prize.type}
        where code = ${trimmedCode} and is_used = false
        returning id
      `;

      if (updateResult.length === 0) {
        // حد تاني سبقنا واستخدم الكود بنفس اللحظة
        return NextResponse.json({ error: "عذراً، هذا الكود تم استخدامه للتو" }, { status: 400 });
      }
    }

    // ✅ 3. إذا الجائزة win، نحفظها في جدول الجوائز
    if (prize.type === "win") {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 30); // 30 يوم للمطالبة

      await sql`
        insert into prizes (code_id, player_id, amount, status, deadline)
        values (${codeId}, ${player_id}, ${prize.amount}, 'pending', ${deadline.toISOString()})
      `;

      const playerName = playerData.length > 0 ? playerData[0].nickname : "لاعب";
      const playerUsername = playerData.length > 0 ? playerData[0].telegram_username : "";

      // إشعار للمدير
      waitUntil(
        sendTelegramNotification(
          `🎉 <b>جائزة جديدة!</b>\n\n👤 اللاعب: ${playerName}${
            playerUsername ? ` (@${playerUsername})` : ""
          }\n💰 المبلغ: ${prize.amount.toLocaleString("ar-EG")} ل.س\n🎟️ الكود: ${trimmedCode}`
        )
      );

      // إشعار للاعب (إذا كان مربوط)
      const playerChatId = playerData.length > 0 ? playerData[0].telegram_chat_id : null;

      if (playerChatId) {
        waitUntil(
          sendTelegramNotification(
            `🎉 <b>مبروك! ربحت جائزة</b>\n\n💰 المبلغ: ${prize.amount.toLocaleString("ar-EG")} ل.س\n🎟️ الكود: ${trimmedCode}\n\n📩 تواصل معنا لاستلام جائزتك.`,
            playerChatId,
            "https://t.me/FaresRobert"
          )
        );
      }
    }

    return NextResponse.json({
      success: true,
      prize: {
        type: prize.type,
        amount: prize.amount,
        label: prize.label,
      },
      player: {
        id: player_id,
        name: playerData.length > 0 ? playerData[0].nickname : "لاعب",
        username: playerData.length > 0 ? playerData[0].telegram_username : "",
      },
    });
  } catch (error) {
    console.error("Spin error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}