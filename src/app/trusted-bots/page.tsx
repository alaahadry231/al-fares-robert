"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { trackView, trackClick } from "@/lib/tracking";

type TrustedBot = {
  id: number;
  name: string;
  description: string;
  bot_url: string;
  image_url: string;
};

export default function TrustedBotsPage() {
  const [bots, setBots] = useState<TrustedBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    trackView("/trusted-bots");

    const fetchBots = async () => {
      try {
        const res = await fetch("/api/trusted-bots");
        const json = await res.json();
        setBots(json.data || []);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBots();
  }, []);

  const filtered = bots.filter((b) => b.name.includes(search));

  const handleClick = (bot: TrustedBot) => {
    trackClick("bot", bot.id, bot.name);
  };

  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden py-16 text-center bg-gradient-to-b from-sky-500/10 to-slate-950">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl md:text-5xl font-bold mb-3">
            🤖 البوتات <span className="text-sky-400">الموثوقة</span>
          </h1>
          <p className="text-slate-400 text-lg">أفضل البوتات المعتمدة على Ichancy</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8 max-w-md mx-auto">
          <input
            type="text"
            placeholder="ابحث باسم البوت..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-5 py-3.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-sky-500 focus:outline-none text-white placeholder:text-slate-500 transition"
          />
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <div className="text-6xl mb-4">🤖</div>
            <p>لا توجد بوتات موثوقة حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((bot) => (
              <div
                key={bot.id}
                className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden hover:border-sky-500/50 transition group flex flex-col"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={bot.image_url || "https://placehold.co/400x300/0f172a/0ea5e9?text=Bot"}
                    alt={bot.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-emerald-500 text-slate-900 text-xs font-bold flex items-center gap-1">
                    ✅ موثوق
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold mb-2">{bot.name}</h3>
                  <p className="text-slate-400 text-sm mb-4 flex-1">{bot.description}</p>

                  <a
                    href={bot.bot_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleClick(bot)}
                    className="block w-full px-4 py-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-900 text-sm font-bold text-center transition shadow-lg shadow-sky-500/20"
                  >
                    الدخول إلى البوت 🚀
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}