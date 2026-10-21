"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const publicNavItems = [
  { href: "/", label: "الرئيسية" },
  { href: "/pages", label: "البكجات" },
  { href: "/predict", label: "توقع واربح" },
  { href: "/spin", label: "عجلة الحظ" },
  { href: "/winners", label: "المتصدرين" },
];

const TELEGRAM_CHANNEL = "https://t.me/AlFaresRobert1";

type Player = {
  id: number;
  telegram_username: string;
  nickname: string;
  total_points: number;
};

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [player, setPlayer] = useState<Player | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("player_data");
    if (saved) {
      try {
        setPlayer(JSON.parse(saved));
      } catch {
        // نتجاهل
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("player_logged_in");
    localStorage.removeItem("player_data");
    setPlayer(null);
    window.location.href = "/";
  };

  return (
    <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Logo + Name */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Al Fares Robert"
                className="w-12 h-12 rounded-xl object-contain"
              />
              <span className="text-lg font-bold">Al Fares Robert</span>
            </Link>

            <a
              href={TELEGRAM_CHANNEL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex group items-center gap-2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-sky-500/20 to-blue-500/20 hover:from-sky-500/30 hover:to-blue-500/30 border border-sky-500/40 hover:border-sky-400 text-sky-400 hover:text-sky-300 text-[10px] font-semibold transition-all duration-300"
            >
              <span className="relative flex items-center justify-center">
                <span className="absolute w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping opacity-75"></span>
                <span className="relative w-1.5 h-1.5 rounded-full bg-sky-400"></span>
              </span>
              <span>قناتنا على تلغرام</span>
            </a>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-5 text-sm">
            {publicNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-slate-300 hover:text-sky-400 transition"
              >
                {item.label}
              </Link>
            ))}
            {player && (
              <Link
                href="/my-predictions"
                className="text-sky-400 hover:text-sky-300 font-semibold transition"
              >
                📋 توقعاتي
              </Link>
            )}
            {player && (
              <Link
                href="/my-prizes"
                className="text-green-400 hover:text-green-300 font-semibold transition"
              >
                🎁 جوائزي
              </Link>
            )}
          </nav>

          {/* Auth / Mobile Menu */}
          <div className="flex items-center gap-2">
            {player ? (
              <div className="hidden md:flex items-center gap-2">
                {/* زر حسابي */}
                <Link
                  href="/profile"
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-2 transition"
                  title="حسابي"
                >
                  <span className="text-xs">👤</span>
                  <span className="text-sm text-white font-semibold">
                    {player.nickname}
                  </span>
                  <span className="text-xs text-sky-400 font-bold">
                    {player.total_points.toLocaleString("ar-EG")}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm border border-red-500/30 transition"
                >
                  خروج
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden md:inline-block px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-900 text-sm font-bold transition"
              >
                دخول
              </Link>
            )}

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white transition"
              aria-label="القائمة"
            >
              {isOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <nav className="md:hidden mt-4 pt-4 border-t border-slate-800 flex flex-col gap-2">
            {publicNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="px-4 py-3 rounded-xl text-base font-semibold transition bg-slate-800/50 hover:bg-slate-800 text-slate-300"
              >
                {item.label}
              </Link>
            ))}

            {player && (
              <>
                <Link
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-3 rounded-xl text-base font-bold transition bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center justify-between"
                >
                  <span>👤 حسابي</span>
                  <span className="text-sky-400 text-sm">
                    ⭐ {player.total_points.toLocaleString("ar-EG")}
                  </span>
                </Link>

                <Link
                  href="/my-predictions"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-3 rounded-xl text-base font-bold transition bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30"
                >
                  📋 توقعاتي
                </Link>
                <Link
                  href="/my-prizes"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-3 rounded-xl text-base font-bold transition bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30"
                >
                  🎁 جوائزي
                </Link>
              </>
            )}

            {player ? (
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="px-4 py-3 rounded-xl text-base font-bold transition bg-red-500/10 text-red-400 border border-red-500/30 mt-2"
              >
                🚪 تسجيل خروج
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="px-4 py-3 rounded-xl text-base font-bold transition bg-sky-500 hover:bg-sky-400 text-slate-900 text-center mt-2"
              >
                تسجيل الدخول
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}