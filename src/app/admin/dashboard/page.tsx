"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminDashboard() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // نتحقق من تسجيل الدخول
    const isLoggedIn = localStorage.getItem("admin_logged_in");
    if (!isLoggedIn) {
      router.push("/admin");
    } else {
      setIsChecking(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("admin_logged_in");
    router.push("/admin");
  };

  if (isChecking) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500">جاري التحقق...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Al Fares Robert"
              className="w-10 h-10 object-contain"
            />
            <h1 className="text-lg font-bold">لوحة الإدارة</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/stats"
              className="px-4 py-2 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-sm border border-sky-500/30 transition"
            >
              📊 الإحصائيات
            </Link>
            <Link
              href="/"
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm transition"
            >
              عرض الموقع
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm border border-red-500/30 transition"
            >
              خروج
            </button>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">أهلاً بك 👋</h2>
          <p className="text-slate-400">اختر قسم لإدارته</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Pages */}
          <Link
            href="/admin/pages"
            className="bg-slate-900 rounded-2xl border border-slate-800 hover:border-sky-500/50 p-6 transition group"
          >
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-2xl mb-4">
              🏆
            </div>
            <h3 className="text-lg font-bold mb-1 group-hover:text-sky-400 transition">
              البكجات
            </h3>
            <p className="text-slate-400 text-sm">إدارة البكجات الرياضية</p>
          </Link>

          {/* Matches */}
          <Link
            href="/admin/matches"
            className="bg-slate-900 rounded-2xl border border-slate-800 hover:border-sky-500/50 p-6 transition group"
          >
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-2xl mb-4">
              ⚽
            </div>
            <h3 className="text-lg font-bold mb-1 group-hover:text-sky-400 transition">
              المباريات
            </h3>
            <p className="text-slate-400 text-sm">إدارة المباريات والتوقعات</p>
          </Link>

          {/* Spin Codes */}
          <Link
            href="/admin/spin-codes"
            className="bg-slate-900 rounded-2xl border border-slate-800 hover:border-sky-500/50 p-6 transition group"
          >
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-2xl mb-4">
              🎟️
            </div>
            <h3 className="text-lg font-bold mb-1 group-hover:text-sky-400 transition">
              أكواد العجلة
            </h3>
            <p className="text-slate-400 text-sm">توليد وإدارة أكواد العجلة</p>
          </Link>

          {/* Prizes */}
          <Link
            href="/admin/prizes"
            className="bg-slate-900 rounded-2xl border border-slate-800 hover:border-sky-500/50 p-6 transition group"
          >
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-2xl mb-4">
              🎁
            </div>
            <h3 className="text-lg font-bold mb-1 group-hover:text-sky-400 transition">
              الجوائز
            </h3>
            <p className="text-slate-400 text-sm">إدارة جوائز العجلة</p>
          </Link>

          {/* Players */}
          <Link
            href="/admin/players"
            className="bg-slate-900 rounded-2xl border border-slate-800 hover:border-sky-500/50 p-6 transition group"
          >
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-2xl mb-4">
              👥
            </div>
            <h3 className="text-lg font-bold mb-1 group-hover:text-sky-400 transition">
              اللاعبين
            </h3>
            <p className="text-slate-400 text-sm">إدارة حسابات اللاعبين</p>
          </Link>

          {/* Stats */}
          <Link
            href="/admin/stats"
            className="bg-slate-900 rounded-2xl border border-slate-800 hover:border-sky-500/50 p-6 transition group"
          >
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-2xl mb-4">
              📊
            </div>
            <h3 className="text-lg font-bold mb-1 group-hover:text-sky-400 transition">
              الإحصائيات
            </h3>
            <p className="text-slate-400 text-sm">إحصائيات الموقع</p>
          </Link>
        </div>
      </section>
    </main>
  );
}