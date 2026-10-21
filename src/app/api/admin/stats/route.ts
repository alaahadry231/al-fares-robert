import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "all";

    // نحسب التاريخ حسب الفلتر
    let dateFilter: string | null = null;
    if (range === "today") {
      dateFilter = "CURRENT_DATE";
    } else if (range === "week") {
      dateFilter = "NOW() - INTERVAL '7 days'";
    } else if (range === "month") {
      dateFilter = "NOW() - INTERVAL '30 days'";
    }

    // ============ اللاعبين ============
    const totalPlayers = await sql`
      select count(*)::int as count from players
    `;

    const bannedPlayers = await sql`
      select count(*)::int as count from players where is_banned = true
    `;

    // ============ التوقعات ============
    let totalPredictions;
    let correctPredictions;

    if (dateFilter) {
      totalPredictions = await sql`
        select count(*)::int as count from predictions
        where created_at >= ${sql.unsafe(dateFilter)}
      `;
      correctPredictions = await sql`
        select count(*)::int as count from predictions
        where is_correct = true and created_at >= ${sql.unsafe(dateFilter)}
      `;
    } else {
      totalPredictions = await sql`
        select count(*)::int as count from predictions
      `;
      correctPredictions = await sql`
        select count(*)::int as count from predictions where is_correct = true
      `;
    }

    // ============ الأكواد ============
    const totalCodes = await sql`
      select count(*)::int as count from spin_codes
    `;

    const usedCodes = await sql`
      select count(*)::int as count from spin_codes where is_used = true
    `;

    const unusedCodes = await sql`
      select count(*)::int as count from spin_codes where is_used = false
    `;

    // ============ الجوائز ============
    let totalPrizes;
    let pendingPrizes;
    let deliveredPrizes;
    let expiredPrizes;
    let totalAmount;
    let pendingAmount;
    let deliveredAmount;

    if (dateFilter) {
      totalPrizes = await sql`
        select count(*)::int as count from prizes
        where created_at >= ${sql.unsafe(dateFilter)}
      `;
      pendingPrizes = await sql`
        select count(*)::int as count from prizes
        where status = 'pending' and created_at >= ${sql.unsafe(dateFilter)}
      `;
      deliveredPrizes = await sql`
        select count(*)::int as count from prizes
        where status = 'delivered' and created_at >= ${sql.unsafe(dateFilter)}
      `;
      expiredPrizes = await sql`
        select count(*)::int as count from prizes
        where status = 'expired' and created_at >= ${sql.unsafe(dateFilter)}
      `;
      totalAmount = await sql`
        select coalesce(sum(amount), 0)::int as total from prizes
        where created_at >= ${sql.unsafe(dateFilter)}
      `;
      pendingAmount = await sql`
        select coalesce(sum(amount), 0)::int as total from prizes
        where status = 'pending' and created_at >= ${sql.unsafe(dateFilter)}
      `;
      deliveredAmount = await sql`
        select coalesce(sum(amount), 0)::int as total from prizes
        where status = 'delivered' and created_at >= ${sql.unsafe(dateFilter)}
      `;
    } else {
      totalPrizes = await sql`
        select count(*)::int as count from prizes
      `;
      pendingPrizes = await sql`
        select count(*)::int as count from prizes where status = 'pending'
      `;
      deliveredPrizes = await sql`
        select count(*)::int as count from prizes where status = 'delivered'
      `;
      expiredPrizes = await sql`
        select count(*)::int as count from prizes where status = 'expired'
      `;
      totalAmount = await sql`
        select coalesce(sum(amount), 0)::int as total from prizes
      `;
      pendingAmount = await sql`
        select coalesce(sum(amount), 0)::int as total from prizes where status = 'pending'
      `;
      deliveredAmount = await sql`
        select coalesce(sum(amount), 0)::int as total from prizes where status = 'delivered'
      `;
    }

    // ============ توزيع الجوائز (كل مبلغ كم مرة) ============
    let prizesByAmount;
    if (dateFilter) {
      prizesByAmount = await sql`
        select amount, count(*)::int as count
        from prizes
        where created_at >= ${sql.unsafe(dateFilter)}
        group by amount
        order by amount desc
      `;
    } else {
      prizesByAmount = await sql`
        select amount, count(*)::int as count
        from prizes
        group by amount
        order by amount desc
      `;
    }

    return NextResponse.json({
      players: {
        total: totalPlayers[0].count,
        banned: bannedPlayers[0].count,
      },
      predictions: {
        total: totalPredictions[0].count,
        correct: correctPredictions[0].count,
      },
      codes: {
        total: totalCodes[0].count,
        used: usedCodes[0].count,
        unused: unusedCodes[0].count,
      },
      prizes: {
        total: totalPrizes[0].count,
        pending: pendingPrizes[0].count,
        delivered: deliveredPrizes[0].count,
        expired: expiredPrizes[0].count,
        byAmount: prizesByAmount,
      },
      amounts: {
        total: totalAmount[0].total,
        pending: pendingAmount[0].total,
        delivered: deliveredAmount[0].total,
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}