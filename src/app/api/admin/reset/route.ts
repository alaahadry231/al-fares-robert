import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { confirmText } = body;

    // حماية إضافية
    if (confirmText !== "مسح") {
      return NextResponse.json(
        { error: "يجب كتابة كلمة 'مسح' لتأكيد العملية" },
        { status: 400 }
      );
    }

    // 1. مسح الجداول المرتبطة أولاً (عشان المفاتيح الأجنبية)
    await sql`delete from prizes`;
    await sql`delete from predictions`;
    await sql`delete from spin_codes`;
    
    // 2. مسح الجداول الأساسية
    await sql`delete from matches`;
    await sql`delete from sports_pages`;
    await sql`delete from players`;

    // 3. إعادة تصفير العداد (Auto Increment)
    await sql`alter table prizes restart with 1`;
    await sql`alter table predictions restart with 1`;
    await sql`alter table spin_codes restart with 1`;
    await sql`alter table matches restart with 1`;
    await sql`alter table sports_pages restart with 1`;
    await sql`alter table players restart with 1`;

    return NextResponse.json({ success: true, message: "تم مسح جميع البيانات بنجاح" });
  } catch (error: any) {
    console.error("Reset error details:", error);
    return NextResponse.json(
      { error: error.message || "حدث خطأ أثناء المسح" }, 
      { status: 500 }
    );
  }
}