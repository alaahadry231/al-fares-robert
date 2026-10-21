"use client";

import { useEffect, useState } from "react";
import { trackView, trackClick } from "@/lib/tracking";

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
  image_url: string | null;
};

export default function PagesPage() {
  const [pages, setPages] = useState<SportsPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  
  // حالة عرض الصور
  const [viewingImages, setViewingImages] = useState<{
    name: string;
    images: string[];
  } | null>(null);

  useEffect(() => {
    trackView("/pages");

    const fetchPages = async () => {
      try {
        const res = await fetch("/api/pages");
        const json = await res.json();
        if (json.data) {
          setPages(json.data);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, []);

  const filtered = pages.filter(
    (p) =>
      p.name.includes(search) ||
      p.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = async (code: string, id: number, name: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      trackClick("page", id, name);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      alert("تعذر النسخ، جرّب يدوياً");
    }
  };

  const openImages = (name: string, imagesStr: string) => {
    if (!imagesStr) return;
    const images = imagesStr.split(",").map(url => url.trim()).filter(url => url !== "");
    if (images.length === 0) return;
    setViewingImages({ name, images });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "won":
        return <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold border border-green-500/30">✅ رابح</span>;
      case "lost":
        return <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/30">❌ خاسر</span>;
      default:
        return <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-semibold border border-yellow-500/30">⏳ قيد الانتظار</span>;
    }
  };

  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden py-16 text-center bg-gradient-to-b from-sky-500/10 to-slate-950">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl md:text-5xl font-bold mb-3">
            البكجات <span className="text-sky-400">الرياضية</span>
          </h1>
          <p className="text-slate-400 text-lg">
            اختر البكج المناسب واستخدم الكود
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8 max-w-md mx-auto">
          <input
            type="text"
            placeholder="ابحث باسم البكج أو الكود..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-5 py-3.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-sky-500 focus:outline-none text-white placeholder:text-slate-500 transition"
          />
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <div className="text-6xl mb-4">⚽</div>
            <p>لا توجد بكجات منشورة حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => {
              const hasImages = item.image_url && item.image_url.trim() !== "";
              const imageCount = hasImages ? item.image_url!.split(",").filter(u => u.trim() !== "").length : 0;

              return (
                <div
                  key={item.id}
                  className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden hover:border-sky-500/50 transition p-5 flex flex-col"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold mb-1">{item.name}</h3>
                      <p className="text-slate-400 text-sm">{item.description}</p>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-sky-500 text-slate-900 text-xs font-bold whitespace-nowrap shrink-0">
                      ريت ×{item.rate.replace("×", "")}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span className="inline-block px-3 py-1 rounded-full bg-slate-950 text-sky-400 text-xs border border-slate-800">
                      {item.category}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>

                  <div className="text-sm text-slate-400 mb-4">
                    ⚽ {item.matches_count} مباراة
                  </div>

                  <div className="bg-slate-950 rounded-lg p-3 mb-4 border border-slate-800">
                    <div className="text-xs text-slate-500 mb-1">الكود:</div>
                    <div className="font-mono text-sky-400 text-sm break-all">
                      {item.code}
                    </div>
                  </div>

                  <div className="mt-auto space-y-2">
                    {hasImages && imageCount > 0 && (
                      <button
                        onClick={() => openImages(item.name, item.image_url!)}
                        className="w-full px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 text-sm font-semibold transition border border-slate-700"
                      >
                        🖼️ عرض صور البكج ({imageCount})
                      </button>
                    )}
                    <button
                      onClick={() => handleCopy(item.code, item.id, item.name)}
                      className="w-full px-4 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-900 text-sm font-bold transition"
                    >
                      {copiedId === item.id ? "✓ تم النسخ" : "نسخ الكود"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* نافذة عرض الصور */}
      {viewingImages && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setViewingImages(null)}
        >
          <div 
            className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-sky-400 truncate">
                🖼️ صور: {viewingImages.name}
              </h3>
              <button
                onClick={() => setViewingImages(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {viewingImages.images.map((img, idx) => (
                  <div key={idx} className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={img} 
                      alt={`صورة ${idx + 1}`}
                      className="w-full h-auto object-contain max-h-[60vh]"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}