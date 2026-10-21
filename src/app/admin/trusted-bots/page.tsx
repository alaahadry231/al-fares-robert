"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type TrustedBot = {
  id: number;
  name: string;
  description: string;
  bot_url: string;
  image_url: string;
  is_published: boolean;
};

const emptyForm = {
  name: "",
  description: "",
  bot_url: "",
  image_url: "",
  is_published: true,
};

export default function AdminTrustedBots() {
  const router = useRouter();
  const [bots, setBots] = useState<TrustedBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchBots = async () => {
    try {
      const res = await fetch("/api/admin/trusted-bots");
      const json = await res.json();
      setBots(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("admin_logged_in");
    if (!isLoggedIn) {
      router.push("/admin");
      return;
    }
    fetchBots();
  }, [router]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  };

  const openEdit = (bot: TrustedBot) => {
    setEditingId(bot.id);
    setForm({
      name: bot.name,
      description: bot.description,
      bot_url: bot.bot_url,
      image_url: bot.image_url,
      is_published: bot.is_published,
    });
    setError("");
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const url = editingId
      ? `/api/admin/trusted-bots/${editingId}`
      : "/api/admin/trusted-bots";
    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "حدث خطأ");
        setSaving(false);
        return;
      }

      setShowModal(false);
      setForm(emptyForm);
      setEditingId(null);
      await fetchBots();
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${name}"؟`)) return;
    try {
      const res = await fetch(`/api/admin/trusted-bots/${id}`, { method: "DELETE" });
      if (!res.ok) {
        alert("فشل الحذف");
        return;
      }
      await fetchBots();
    } catch {
      alert("تعذر الاتصال بالخادم");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
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
            <h1 className="text-lg font-bold">إدارة البوتات الموثوقة</h1>
          </div>
          <button
            onClick={openAdd}
            className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-900 font-bold text-sm transition"
          >
            + إضافة بوت
          </button>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-8">
        {bots.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <div className="text-6xl mb-4">🤖</div>
            <p>لا توجد بوتات مضافة بعد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bots.map((bot) => (
              <div
                key={bot.id}
                className={`bg-slate-900 rounded-2xl border p-4 flex items-center gap-4 flex-wrap ${
                  bot.is_published ? "border-slate-800" : "border-slate-800 opacity-60"
                }`}
              >
                <img
                  src={bot.image_url || "https://placehold.co/100x100/0f172a/0ea5e9?text=Bot"}
                  alt={bot.name}
                  className="w-16 h-16 rounded-xl object-cover shrink-0"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-lg">{bot.name}</h3>
                    {!bot.is_published && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 text-xs">
                        ⏸️ مخفي
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-sm line-clamp-1">{bot.description}</p>
                  <div className="text-xs text-sky-400 mt-1 font-mono truncate" dir="ltr">
                    {bot.bot_url}
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => openEdit(bot)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs transition"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(bot.id, bot.name)}
                    className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs border border-red-500/30 transition"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-lg my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="text-xl font-bold">
                {editingId ? "تعديل بوت" : "إضافة بوت جديد"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm text-slate-400 mb-2">اسم البوت *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:outline-none text-white transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">الوصف</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:outline-none text-white transition"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">رابط البوت *</label>
                <input
                  type="url"
                  value={form.bot_url}
                  onChange={(e) => setForm({ ...form, bot_url: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:outline-none text-white transition"
                  required
                  dir="ltr"
                  placeholder="https://t.me/..."
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">رابط صورة البوت</label>
                <input
                  type="url"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:outline-none text-white transition"
                  dir="ltr"
                  placeholder="https://..."
                />
                {form.image_url && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-slate-800 w-32 h-32">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.image_url} alt="معاينة" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={form.is_published}
                  onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                  className="w-5 h-5 rounded accent-sky-500"
                />
                <label htmlFor="is_published" className="text-sm text-slate-300">
                  نشر البوت (يظهر للزوار)
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-900 font-bold transition"
                >
                  {saving ? "جاري الحفظ..." : editingId ? "حفظ التعديلات" : "إضافة البوت"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}