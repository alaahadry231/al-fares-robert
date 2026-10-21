"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Prize = {
  id: number;
  amount: number;
  status: string;
  created_at: string;
  delivered_at: string | null;
  deadline: string | null;
  code: string | null;
};

type Player = {
  id: number;
  nickname: string;
  total_points: number;
};

export default function MyPrizesPage() {
  const router = useRouter();
  const [player, setPlayer] = useState<Player | null>(null);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("player_data");
    if (!saved) {
      router.push("/login");
      return;
    }

    try {
      const playerData = JSON.parse(saved);
      setPlayer(playerData);

      const fetchPrizes = async () => {
        try {
          const res = await fetch(`/api/prizes/my-prizes?player_id=${playerData.id}`);
          const json = await res.json();
          setPrizes(json.data || []);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      fetchPrizes();
    } catch {
      router.push("/login");
    }
  }, [router]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      const date = new Date(dateStr);
      return date.toLocaleString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Damascus",
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs border border-green-500/30">✅ تم التسليم</span>;
      case "expired":
        return <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs border border-red-500/30">❌ منتهية</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs border border-yellow-500/30">⏳ بانتظار التسليم</span>;
    }
  };

  if (!player) return null;

  const botLink = `https://t.me/AlFaresRobert_bot?start=player_${player.id}`;

  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden py-12 text-center bg-gradient-to-b from-sky-500/10 to-slate-950">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl md:text-5xl font-bold mb-3">
            🎁 جوائزي
          </h1>
          <p className="text-slate-400 text-base">
            أهلاً {player.nickname}
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-8">
        {/* زr ربط الحساب */}
        <div className="mb-6 bg-sky-500/10 border-2 border-sky-500/30 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="text-3xl">🤖</div>
            <div className="flex-1">
              <h3 className="font-bold mb-1">اربط حسابك بالبوت</h3>
              <p className="text-slate-400 text-sm mb-3">
                اربط حسابك لتستلم إشعارات فورية عندما تربح جوائز أو تظهر نتائج توقعاتك
              </p>
              <a
                href={botLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-900 font-bold text-sm transition"
              >
                📩 ربط الحساب عبر تلغرام
              </a>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500">جاري التحميل...</div>
        ) : prizes.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <div className="text-6xl mb-4">🎁</div>
            <p>لم تربح أي جائزة بعد</p>
            <Link href="/spin" className="inline-block mt-4 px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-900 font-bold transition">
              جرّب عجلة الحظ
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {prizes.map((p) => (
              <div key={p.id} className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-2xl font-bold text-sky-400 mb-1">
                      {p.amount.toLocaleString("ar-EG")} ل.س
                    </div>
                    <div className="text-xs text-slate-500 font-mono" dir="ltr">
                      الكود: {p.code || "—"}
                    </div>
                  </div>
                  <div>{getStatusBadge(p.status)}</div>
                </div>

                <div className="text-xs text-slate-500">
                  📅 {formatDate(p.created_at)}
                </div>

                {p.status === "pending" && (
                  <div className="mt-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 text-yellow-400 text-xs text-center">
                    تواصل معنا على تلغرام لاستلام جائزتك
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}