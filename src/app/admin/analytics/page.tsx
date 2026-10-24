"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type AnalyticsData = {
  visitors: { unique: number; total_views: number };
  clicks: { pages: number; bots: number };
  views_by_page: { page_path: string; views: number; unique_visitors: number }[];
  top_pages: { item_name: string; clicks: number }[];
  top_bots: { item_name: string; clicks: number }[];
};

const pageNames: Record<string, string> = {
  "/": "الصفحة الرئيسية",
  "/pages": "البكجات",
  "/predict": "توقع واربح",
  "/spin": "عجلة الحظ",
  "/trusted-bots": "البوتات الموثوقة",
  "/winners": "المتصدرين",
};

export default function AdminAnalytics() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("admin_logged_in");
    if (!isLoggedIn) {
      router.push("/admin");
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch("/api/admin/analytics");
        const json = await res.json();
        if (!json.error) setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-slate-500">جاري التحميل...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950">
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard" className="text-slate-400 hover:text-sky-400">←</Link>
            <h1 className="text-lg font-bold">📈 إحصائيات الزوار</h1>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm transition"
          >
            🔄 تحديث
          </button>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Top Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
            <div className="text-slate-400 text-sm mb-2">👥 زوار فريدون</div>
            <div className="text-3xl font-bold text-sky-400">{data?.visitors.unique.toLocaleString("ar-EG")}</div>
          </div>
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
            <div className="text-slate-400 text-sm mb-2">👁️ إجمالي الزيارات</div>
            <div className="text-3xl font-bold text-sky-400">{data?.visitors.total_views.toLocaleString("ar-EG")}</div>
          </div>
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
            <div className="text-slate-400 text-sm mb-2">🏆 نقرات البكجات</div>
            <div className="text-3xl font-bold text-green-400">{data?.clicks.pages.toLocaleString("ar-EG")}</div>
          </div>
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
            <div className="text-slate-400 text-sm mb-2">🤖 نقرات البوتات</div>
            <div className="text-3xl font-bold text-yellow-400">{data?.clicks.bots.toLocaleString("ar-EG")}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* الزيارات حسب الصفحة */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
            <h2 className="text-xl font-bold mb-4">📄 الزيارات حسب الصفحة</h2>
            <div className="space-y-3">
              {data?.views_by_page.map((page) => (
                <div key={page.page_path} className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="font-bold text-sm">{pageNames[page.page_path] || page.page_path}</div>
                  <div className="text-right">
                    <div className="text-sky-400 font-bold text-sm">{page.views} <span className="text-xs text-slate-500">زيارة</span></div>
                    <div className="text-[10px] text-slate-500">{page.unique_visitors} زائر فريد</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {/* أكثر 3 بكجات نقرات */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
              <h2 className="text-xl font-bold mb-4">🔥 أكثر 3 بكجات نقرات</h2>
              <div className="space-y-3">
                {data?.top_pages.length === 0 ? (
                  <div className="text-slate-500 text-center py-4">لا توجد نقرات بعد</div>
                ) : (
                  data?.top_pages.map((page, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 flex items-center justify-center font-bold text-sm shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 font-bold text-sm truncate">{page.item_name}</div>
                      <div className="text-green-400 font-bold text-sm">{page.clicks} <span className="text-xs text-slate-500">نقرة</span></div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* أكثر 3 بوتات نقرات */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
              <h2 className="text-xl font-bold mb-4">🔥 أكثر 3 بوتات نقرات</h2>
              <div className="space-y-3">
                {data?.top_bots.length === 0 ? (
                  <div className="text-slate-500 text-center py-4">لا توجد نقرات بعد</div>
                ) : (
                  data?.top_bots.map((bot, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <div className="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center justify-center font-bold text-sm shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 font-bold text-sm truncate">{bot.item_name}</div>
                      <div className="text-yellow-400 font-bold text-sm">{bot.clicks} <span className="text-xs text-slate-500">نقرة</span></div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}