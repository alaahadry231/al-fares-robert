"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type PrizeByAmount = {
  amount: number;
  count: number;
};

type Stats = {
  players: { total: number; banned: number };
  predictions: { total: number; correct: number };
  codes: { total: number; used: number; unused: number };
  prizes: {
    total: number;
    pending: number;
    delivered: number;
    expired: number;
    byAmount: PrizeByAmount[];
  };
  amounts: {
    total: number;
    pending: number;
    delivered: number;
  };
};

const formatNumber = (num: number) => num.toLocaleString("ar-EG");

export default function AdminStats() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"all" | "today" | "week" | "month">("all");

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("admin_logged_in");
    if (!isLoggedIn) {
      router.push("/admin");
      return;
    }
  }, [router]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/stats?range=${range}`);
        const json = await res.json();
        if (!json.error) {
          setStats(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [range]);

  return (
    <main className="min-h-screen bg-slate-950">
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard" className="text-slate-400 hover:text-sky-400">←</Link>
            <h1 className="text-lg font-bold">📊 الإحصائيات</h1>
          </div>
          <button
            onClick={() => {
              const fetchStats = async () => {
                setLoading(true);
                try {
                  const res = await fetch(`/api/admin/stats?range=${range}`);
                  const json = await res.json();
                  if (!json.error) setStats(json);
                } catch (err) {
                  console.error(err);
                } finally {
                  setLoading(false);
                }
              };
              fetchStats();
            }}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm transition"
          >
            🔄 تحديث
          </button>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-8">
        {/* فلتر التاريخ */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setRange("all")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              range === "all"
                ? "bg-sky-500 text-slate-900"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setRange("today")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              range === "today"
                ? "bg-sky-500 text-slate-900"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            اليوم
          </button>
          <button
            onClick={() => setRange("week")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              range === "week"
                ? "bg-sky-500 text-slate-900"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            آخر 7 أيام
          </button>
          <button
            onClick={() => setRange("month")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              range === "month"
                ? "bg-sky-500 text-slate-900"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            آخر 30 يوم
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500">جاري التحميل...</div>
        ) : !stats ? (
          <div className="text-center py-20 text-red-400">فشل تحميل الإحصائيات</div>
        ) : (
          <>
            {/* بطاقات الأرقام الرئيسية */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
                <div className="text-slate-400 text-sm mb-2">👥 اللاعبين</div>
                <div className="text-3xl font-bold text-sky-400">{formatNumber(stats.players.total)}</div>
                {stats.players.banned > 0 && (
                  <div className="text-xs text-red-400 mt-1">{stats.players.banned} محظور</div>
                )}
              </div>

              <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
                <div className="text-slate-400 text-sm mb-2">🎯 التوقعات</div>
                <div className="text-3xl font-bold text-sky-400">{formatNumber(stats.predictions.total)}</div>
                {stats.predictions.correct > 0 && (
                  <div className="text-xs text-green-400 mt-1">{stats.predictions.correct} صحيحة</div>
                )}
              </div>

              <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
                <div className="text-slate-400 text-sm mb-2">🎟️ الأكواد</div>
                <div className="text-3xl font-bold text-sky-400">{formatNumber(stats.codes.total)}</div>
                <div className="text-xs text-green-400 mt-1">{stats.codes.unused} متاحة</div>
                <div className="text-xs text-slate-500">{stats.codes.used} مستخدمة</div>
              </div>

              <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
                <div className="text-slate-400 text-sm mb-2">🎁 الجوائز</div>
                <div className="text-3xl font-bold text-sky-400">{formatNumber(stats.prizes.total)}</div>
                <div className="text-xs text-yellow-400 mt-1">{stats.prizes.pending} بانتظار</div>
                <div className="text-xs text-green-400">{stats.prizes.delivered} تم التسليم</div>
              </div>
            </div>

            {/* المبالغ المالية */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gradient-to-br from-sky-500/10 to-blue-500/10 rounded-2xl p-5 border border-sky-500/30">
                <div className="text-slate-300 text-sm mb-2">💰 إجمالي الجوائز</div>
                <div className="text-3xl font-bold text-white">
                  {formatNumber(stats.amounts.total)} <span className="text-sm text-slate-400">ل.س</span>
                </div>
              </div>

              <div className="bg-yellow-500/10 rounded-2xl p-5 border border-yellow-500/30">
                <div className="text-slate-300 text-sm mb-2">⏳ بانتظار التسليم</div>
                <div className="text-3xl font-bold text-yellow-400">
                  {formatNumber(stats.amounts.pending)} <span className="text-sm text-slate-400">ل.س</span>
                </div>
              </div>

              <div className="bg-green-500/10 rounded-2xl p-5 border border-green-500/30">
                <div className="text-slate-300 text-sm mb-2">✅ تم التسليم</div>
                <div className="text-3xl font-bold text-green-400">
                  {formatNumber(stats.amounts.delivered)} <span className="text-sm text-slate-400">ل.س</span>
                </div>
              </div>
            </div>

            {/* توزيع الجوائز حسب المبلغ */}
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 mb-8">
              <h2 className="text-xl font-bold mb-4">🎯 توزيع الجوائز حسب المبلغ</h2>
              {stats.prizes.byAmount.length === 0 ? (
                <div className="text-center py-8 text-slate-500">لا توجد جوائز بعد</div>
              ) : (
                <div className="space-y-3">
                  {stats.prizes.byAmount.map((item) => (
                    <div
                      key={item.amount}
                      className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800"
                    >
                      <div className="font-bold text-sky-400">
                        {formatNumber(item.amount)} ل.س
                      </div>
                      <div className="text-white font-bold">
                        {item.count} <span className="text-xs text-slate-400">مرة</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* حالة الجوائز التفصيلية */}
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <h2 className="text-xl font-bold mb-4">📊 حالة الجوائز</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
                  <span className="text-yellow-400">⏳ بانتظار التسليم</span>
                  <span className="font-bold text-white">{stats.prizes.pending}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-xl border border-green-500/30">
                  <span className="text-green-400">✅ تم التسليم</span>
                  <span className="font-bold text-white">{stats.prizes.delivered}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-xl border border-red-500/30">
                  <span className="text-red-400">❌ منتهية</span>
                  <span className="font-bold text-white">{stats.prizes.expired}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}