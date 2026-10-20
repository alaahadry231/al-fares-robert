import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

// دالة توليد كود عشوائي
function generateCode(length: number = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET: جلب كل الأكواد
export async function GET() {
  try {
    const data = await sql`
      select * from spin_codes
      order by created_at desc
    `;
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST: توليد أكواد جديدة
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { count, length } = body;

    const numCount = Math.min(Math.max(parseInt(count) || 1, 1), 500);
    const codeLength = Math.min(Math.max(parseInt(length) || 8, 6), 16);

    const newCodes: string[] = [];
    let attempts = 0;
    const maxAttempts = numCount * 3;

    while (newCodes.length < numCount && attempts < maxAttempts) {
      attempts++;
      const code = generateCode(codeLength);
      if (newCodes.includes(code)) continue;

      try {
        await sql`
          insert into spin_codes (code)
          values (${code})
          on conflict (code) do nothing
        `;
        newCodes.push(code);
      } catch (err) {
        // تكرار، نتجاهل
      }
    }

    return NextResponse.json({ success: true, generated: newCodes.length });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json({ error: "Generate failed" }, { status: 500 });
  }
}