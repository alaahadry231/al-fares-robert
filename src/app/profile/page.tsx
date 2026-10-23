"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Player = {
  id: number;
  telegram_id: string;
  telegram_username: string;
  nickname: string;
  total_points: number;
  is_banned: boolean;
  is_linked: boolean;
  created_at: string;
};

type Stats = {
  predictions_count: number;
  prizes_count: number;
};

export default function ProfilePage() {
  const router = useRouter();
  const [player, setPlayer] = useState<Player | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [notLoggedIn, setNotLoggedIn] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("player_data");
    if (!saved) {
      setNotLoggedIn(true);
      setLoading(false);
      return;
    }

    try {
      const playerData = JSON.parse(saved);

      const fetchData = async () => {
        try {
          const res = await fetch(`/api/players/me?player_id=${playerData.id}`);
          const json = await res.json();

          if (json.player) {
            setPlayer(json.player);
            setStats(json.stats);
            localStorage.setItem(
              "player_data",
              JSON.stringify({
                id: json.player.id,
                nickname: json.player.nickname,
                telegram_username: json.player.telegram_username,
                telegram_id: json.player.telegram_id,
                total_points: json.player.total_points,
              })
            );
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    } catch {
      setNotLoggedIn(true);
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    if (!confirm("هل أنت متأكد من تسجيل الخروج؟")) return;
    localStorage.removeItem("player_logged_in");
    localStorage.removeItem("player_data");
    router.push("/");
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "Asia/Damascus",
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500">جاري التحميل...</div>
      </main>
    );
  }

  // إذا اللاعب مش مسجل دخول
  if (notLoggedIn || !player) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold mb-2">يجب تسجيل الدخول</h1>
          <p className="text-slate-400 mb-6">
            سجّل دخولك بتلغرام لتتمكن من رؤية صفحة حسابك
          </p>
          <Link
            href="/login"
            className="inline-block px-8 py-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-900 font-bold transition"
          >
            تسجيل الدخول
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden py-12 text-center bg-gradient-to-b from-sky-500/10 to-slate-950">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl md:text-5xl font-bold mb-3">
            👤 حسابي
          </h1>
          <p className="text-slate-400 text-base">
            إدارة معلوماتك الشخصية
          </p>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-4 py-8">
        {/* بطاقة البروفايل */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-sky-500 flex items-center justify-center text-slate-900 text-3xl font-bold shrink-0">
              {player.nickname?.charAt(0)?.toUpperCase() || "👤"}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold mb-1 truncate">
                {player.nickname || "لاعب"}
              </h2>
              {player.telegram_username && (
                <div className="text-sky-400 font-mono text-sm" dir="ltr">
                  @{player.telegram_username}
                </div>
              )}
              <div className="text-xs text-slate-500 mt-1" dir="ltr">
                ID: {player.telegram_id}
              </div>
            </div>
          </div>

          {/* حالة الحساب */}
          <div className="flex gap-2 flex-wrap mb-6">
            {player.is_banned ? (
              <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs border border-red-500/30">
                🚫 حسابك محظور
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs border border-green-500/30">
                ✅ حساب نشط
              </span>
            )}
            {player.is_linked && (
              <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-400 text-xs border border-sky-500/30">
                🔗 مربوط بالبوت
              </span>
            )}
          </div>

          {/* الإحصائيات */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-950 rounded-xl p-4 text-center border border-slate-800">
              <div className="text-2xl font-bold text-sky-400">
                {player.total_points.toLocaleString("ar-EG")}
              </div>
              <div className="text-xs text-slate-500 mt-1">نقطة</div>
            </div>
            <div className="bg-slate-950 rounded-xl p-4 text-center border border-slate-800">
              <div className="text-2xl font-bold text-white">
                {stats?.predictions_count || 0}
              </div>
              <div className="text-xs text-slate-500 mt-1">توقع</div>
            </div>
            <div className="bg-slate-950 rounded-xl p-4 text-center border border-slate-800">
              <div className="text-2xl font-bold text-yellow-400">
                {stats?.prizes_count || 0}
              </div>
              <div className="text-xs text-slate-500 mt-1">جائزة</div>
            </div>
          </div>

          <div className="text-center mt-4 text-xs text-slate-500">
            📅 عضو منذ {formatDate(player.created_at)}
          </div>
        </div>

        {/* الأزرار */}
        <div className="space-y-3">
          <Link
            href="/my-predictions"
            className="flex items-center gap-3 p-4 bg-slate-900 rounded-2xl border border-slate-800 hover:border-sky-500/50 transition group"
          >
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-2xl shrink-0">
              📋
            </div>
            <div className="flex-1">
              <div className="font-bold group-hover:text-sky-400 transition">توقعاتي</div>
              <div className="text-xs text-slate-500">عرض كل توقعاتك ونتائجها</div>
            </div>
            <div className="text-slate-500 group-hover:text-sky-400 transition">←</div>
          </Link>

          <Link
            href="/my-prizes"
            className="flex items-center gap-3 p-4 bg-slate-900 rounded-2xl border border-slate-800 hover:border-sky-500/50 transition group"
          >
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-2xl shrink-0">
              🎁
            </div>
            <div className="flex-1">
              <div className="font-bold group-hover:text-sky-400 transition">جوائزي</div>
              <div className="text-xs text-slate-500">عرض جوائزك وحالة استلامها</div>
            </div>
            <div className="text-slate-500 group-hover:text-sky-400 transition">←</div>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-4 bg-red-500/5 rounded-2xl border border-red-500/30 hover:bg-red-500/10 transition group text-right"
          >
            <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-2xl shrink-0">
              🚪
            </div>
            <div className="flex-1">
              <div className="font-bold text-red-400">تسجيل الخروج</div>
              <div className="text-xs text-slate-500">الخروج من حسابك</div>
            </div>
          </button>
        </div>
      </section>
    </main>
  );
}