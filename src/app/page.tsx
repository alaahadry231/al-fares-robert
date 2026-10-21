"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SportsPage = {
  id: number;
  name: string;
  description: string;
  code: string;
  category: string;
  rate: string;
  matches_count: number;
  status: string;
  is_featured: boolean;
};

type Match = {
  id: number;
  team1: string;
  team2: string;
  team1_logo: string;
  team2_logo: string;
  league: string;
  match_date: string;
  predictions_close_at: string;
};

type Player = {
  id: number;
  name: string;
  points: number;
};

export default function Home() {
  const [pages, setPages] = useState<SportsPage[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pagesRes, matchesRes, playersRes] = await Promise.all([
          fetch("/api/pages"),
          fetch("/api/matches"),
          fetch("/api/leaderboard"),
        ]);

        const pagesJson = await pagesRes.json();
        const matchesJson = await matchesRes.json();
        const playersJson = await playersRes.json();

        setPages(pagesJson.data?.slice(0, 3) || []);
        setMatches(matchesJson.open?.slice(0, 3) || []);
        setPlayers(playersJson.data?.slice(0, 5) || []);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString("ar-EG", {
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

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[500px] md:min-h-[600px] flex items-center justify-center px-4 py-16">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-sky-500/10 via-transparent to-transparent"></div>

        <div className="relative w-full max-w-4xl mx-auto text-center">
          <div className="inline-block px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs md:text-sm mb-6">
            🎯 Al Fares Robert
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight px-2">
            مرحباً بك في{" "}
            <br className="md:hidden" />
            <span className="text-sky-400">Al Fares Robert</span>
          </h1>

          <p className="text-slate-300 text-sm md:text-lg lg:text-xl max-w-2xl mx-auto mb-8 md:mb-10 px-4">
            منصة البكجات والتوقعات الرياضية وعجلة الحظ
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center px-4">
            <Link
              href="/pages"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-900 font-bold transition shadow-lg shadow-sky-500/25 text-base"
            >
              تصفح البكجات
            </Link>
            <Link
              href="/predict"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-400 hover:to-blue-400 text-white font-bold transition shadow-lg shadow-sky-500/25 text-base"
            >
              🎯 توقع واربح
            </Link>
            <Link
              href="/spin"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition border border-slate-700 text-base"
            >
              🎡 عجلة الحظ
            </Link>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="text-center py-20 text-slate-500">
          جاري التحميل...
        </div>
      ) : (
        <>
          {/* Featured Pages */}
          <section className="max-w-6xl mx-auto px-4 py-10 md:py-12">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <div>
                <h2 className="text-xl md:text-3xl font-bold">
                  🏆 بكجات <span className="text-sky-400">اليوم</span>
                </h2>
                <p className="text-slate-400 text-xs md:text-sm mt-1">
                  أحدث البكجات الرياضية
                </p>
              </div>
              <Link
                href="/pages"
                className="text-sky-400 hover:text-sky-300 text-xs md:text-sm font-semibold whitespace-nowrap"
              >
                عرض الكل ←
              </Link>
            </div>

            {pages.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                لا توجد بكجات بعد
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {pages.map((page) => (
                  <Link
                    key={page.id}
                    href="/pages"
                    className="bg-slate-900 rounded-2xl border border-slate-800 p-5 hover:border-sky-500/50 active:border-sky-500/50 transition"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold mb-1 truncate text-base">
                          {page.name}
                        </h3>
                        <p className="text-slate-400 text-sm line-clamp-2">
                          {page.description}
                        </p>
                      </div>
                      <div className="px-2 py-1 rounded-full bg-sky-500 text-slate-900 text-xs font-bold shrink-0">
                        ×{page.rate.replace("×", "")}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-800">
                      <span>⚽ {page.matches_count} مباراة</span>
                      <span className="text-sky-400">عرض →</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Open Matches */}
          <section className="max-w-6xl mx-auto px-4 py-10 md:py-12">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <div>
                <h2 className="text-xl md:text-3xl font-bold">
                  🔥 مباريات <span className="text-sky-400">مفتوحة</span>
                </h2>
                <p className="text-slate-400 text-xs md:text-sm mt-1">
                  توقع الآن قبل إغلاق التوقعات
                </p>
              </div>
              <Link
                href="/predict"
                className="text-sky-400 hover:text-sky-300 text-xs md:text-sm font-semibold whitespace-nowrap"
              >
                عرض الكل ←
              </Link>
            </div>

            {matches.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                لا توجد مباريات مفتوحة حالياً
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className="bg-slate-900 rounded-2xl border border-slate-800 p-5"
                  >
                    <div className="text-xs text-slate-500 mb-3 text-center">
                      {formatDate(match.match_date)}
                    </div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex-1 text-center">
                        <div className="font-bold text-sm truncate">{match.team1}</div>
                      </div>
                      <div className="text-slate-500 text-xs shrink-0">×</div>
                      <div className="flex-1 text-center">
                        <div className="font-bold text-sm truncate">{match.team2}</div>
                      </div>
                    </div>
                    <Link
                      href="/predict"
                      className="block w-full px-4 py-3 rounded-lg bg-sky-500 hover:bg-sky-400 active:bg-sky-400 text-slate-900 text-sm font-bold text-center transition"
                    >
                      توقّع الآن
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Wheel Preview */}
          <section className="max-w-6xl mx-auto px-4 py-10 md:py-12">
            <div className="bg-gradient-to-br from-sky-500/10 to-blue-500/10 rounded-3xl border border-sky-500/30 p-6 md:p-12 text-center">
              <div className="text-5xl md:text-6xl mb-4">🎡</div>
              <h2 className="text-xl md:text-4xl font-bold mb-3">
                عجلة <span className="text-sky-400">الحظ</span>
              </h2>
              <p className="text-slate-300 max-w-md mx-auto mb-6 text-sm md:text-base">
                جرّب حظك واربح جوائز نقدية قيّمة!
              </p>
              <Link
                href="/spin"
                className="inline-block w-full sm:w-auto px-8 py-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-900 font-bold transition shadow-lg shadow-sky-500/25"
              >
                🎡 جرّب العجلة
              </Link>
            </div>
          </section>

          {/* Leaderboard */}
          {players.length > 0 && (
            <section className="max-w-6xl mx-auto px-4 py-10 md:py-12">
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <div>
                  <h2 className="text-xl md:text-3xl font-bold">
                    👑 <span className="text-sky-400">المتصدرين</span>
                  </h2>
                  <p className="text-slate-400 text-xs md:text-sm mt-1">
                    أفضل 5 لاعبين
                  </p>
                </div>
                <Link
                  href="/winners"
                  className="text-sky-400 hover:text-sky-300 text-xs md:text-sm font-semibold whitespace-nowrap"
                >
                  عرض الكل ←
                </Link>
              </div>

              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                {players.map((player, i) => (
                  <div
                    key={player.id}
                    className={`flex items-center gap-3 p-4 ${
                      i < players.length - 1 ? "border-b border-slate-800" : ""
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${
                        i === 0
                          ? "bg-yellow-500 text-slate-900"
                          : i === 1
                          ? "bg-slate-400 text-slate-900"
                          : i === 2
                          ? "bg-orange-600 text-white"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">{player.name}</div>
                    </div>
                    <div className="text-sky-400 font-bold shrink-0 text-sm">
                      {player.points.toLocaleString("ar-EG")} نقطة
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-10 md:mt-20">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-slate-500 text-sm">
          © 2025 Al Fares Robert — جميع الحقوق محفوظة
        </div>
      </footer>
    </main>
  );
}