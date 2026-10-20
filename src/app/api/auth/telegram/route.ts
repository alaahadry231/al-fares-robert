import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      id,
      first_name,
      last_name,
      username,
      photo_url,
      auth_date,
      hash,
    } = body;

    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      return NextResponse.json(
        { error: "إعدادات البوت غير مكتملة" },
        { status: 500 }
      );
    }

    // ✅ التحقق من Hash (حسب توثيق Telegram)
    const dataCheckString = Object.keys(body)
      .filter((key) => key !== "hash")
      .sort()
      .map((key) => `${key}=${body[key]}`)
      .join("\n");

    const secretKey = crypto
      .createHash("sha256")
      .update(botToken)
      .digest();

    const hmac = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    if (hmac !== hash) {
      return NextResponse.json(
        { error: "التحقق من البيانات فشل" },
        { status: 401 }
      );
    }

    // ✅ التحقق من صلاحية الوقت (ما يزيد عن 24 ساعة)
    const now = Math.floor(Date.now() / 1000);
    if (now - auth_date > 86400) {
      return NextResponse.json(
        { error: "انتهت صلاحية تسجيل الدخول" },
        { status: 401 }
      );
    }

    // ✅ البحث عن اللاعب أو إنشاؤه
    const existingPlayer = await sql`
      select * from players where telegram_id = ${id.toString()} limit 1
    `;

    let player;

    if (existingPlayer.length > 0) {
      // تحديث بيانات اللاعب الموجود
      const updated = await sql`
        update players
        set telegram_username = ${username || ""},
            nickname = ${first_name + (last_name ? " " + last_name : "")},
            updated_at = now()
        where telegram_id = ${id.toString()}
        returning *
      `;
      player = updated[0];
    } else {
      // إنشاء لاعب جديد
      const created = await sql`
        insert into players (telegram_id, telegram_username, nickname, password_hash)
        values (
          ${id.toString()},
          ${username || ""},
          ${first_name + (last_name ? " " + last_name : "")},
          ''
        )
        returning *
      `;
      player = created[0];
    }

    // ✅ نرجع بيانات اللاعب
    return NextResponse.json({
      success: true,
      player: {
        id: player.id,
        telegram_id: player.telegram_id,
        telegram_username: player.telegram_username,
        nickname: player.nickname,
        total_points: player.total_points,
        is_banned: player.is_banned,
      },
    });
  } catch (error) {
    console.error("Telegram auth error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تسجيل الدخول" },
      { status: 500 }
    );
  }
}