import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

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
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: "الكود مطلوب" }, { status: 400 });
    }

    const trimmedCode = code.trim().toUpperCase();

    const result = await sql`
      select id, is_used from spin_codes where code = ${trimmedCode} limit 1
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "الكود غير صحيح" }, { status: 404 });
    }

    if (result[0].is_used) {
      return NextResponse.json({ error: "هذا الكود مستخدم من قبل" }, { status: 400 });
    }

    const codeId = result[0].id;
    const prize = pickPrize();

    // إذا "محاولة أخرى" → ما نعلّم الكود كمستخدم
    if (prize.type !== "retry") {
      await sql`
        update spin_codes
        set is_used = true,
            used_at = now(),
            prize_won = ${prize.label},
            prize_type = ${prize.type}
        where code = ${trimmedCode}
      `;
    }

    // ✅ إذا "win" → نحفظ الجائزة في جدول prizes
    if (prize.type === "win") {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 30); // 30 يوم للمطالبة

      await sql`
        insert into prizes (code_id, amount, status, deadline)
        values (${codeId}, ${prize.amount}, 'pending', ${deadline.toISOString()})
      `;
    }

    return NextResponse.json({
      success: true,
      prize: {
        type: prize.type,
        amount: prize.amount,
        label: prize.label,
      },
    });
  } catch (error) {
    console.error("Spin error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}