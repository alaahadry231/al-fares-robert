"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  is_archived: boolean;
  image_url: string | null;
};

const emptyForm = {
  name: "",
  description: "",
  code: "",
  category: "عام",
  rate: "×1",
  matches_count: 0,
  image_urls: "",
};

export default function AdminPages() {
  const router = useRouter();
  const [pages, setPages] = useState<SportsPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchPages = async () => {
    try {
      const res = await fetch("/api/admin/pages");
      const json = await res.json();
      setPages(json.data || []);
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
    fetchPages();
  }, [router]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  };

  const openEdit = (page: SportsPage) => {
    setEditingId(page.id);
    setForm({
      name: page.name,
      description: page.description,
      code: page.code,
      category: page.category,
      rate: page.rate,
      matches_count: page.matches_count,
      image_urls: page.image_url || "",
    });
    setError("");
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      name: form.name,
      description: form.description,
      code: form.code,
      category: form.category,
      rate: form.rate,
      matches_count: form.matches_count,
      image_url: form.image_urls, // نبعته بـ image_url عشان الـ API القديم
    };

    const url = editingId
      ? `/api/admin/pages/${editingId}`
      : "/api/admin/pages";
    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      await fetchPages();
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${name}"؟`)) return;
    try {
      const res = await fetch(`/api/admin/pages/${id}`, { method: "DELETE" });
      if (!res.ok) {
        alert("فشل الحذف");
        return;
      }
      await fetchPages();
    } catch {
      alert("تعذر الاتصال بالخادم");
    }
  };

  const handleAction = async (id: number, action: string, value?: string) => {
    try {
      const body: { action: string; status?: string } = { action };
      if (value) body.status = value;

      const res = await fetch(`/api/admin/pages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        alert("فشل التحديث");
        return;
      }

      await fetchPages();
    } catch {
      alert("تعذر الاتصال بالخادم");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "won":
        return <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs border border-green-500/30">✅ رابح</span>;
      case "lost":
        return <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs border border-red-500/30">❌ خاسر</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs border border-yellow-500/30">⏳ معلق</span>;
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
            <h1 className="text-lg font-bold">إدارة البكجات</h1>
          </div>
          <button
            onClick={openAdd}
            className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-900 font-bold text-sm transition"
          >
            + إضافة بكج
          </button>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-8">
        {pages.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <div className="text-6xl mb-4">📭</div>
            <p>لا توجد بكجات بعد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pages.map((page) => (
              <div
                key={page.id}
                className={`bg-slate-900 rounded-2xl border p-4 ${
                  page.is_archived ? "border-slate-800 opacity-60" : "border-slate-800"
                }`}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold">{page.name}</h3>
                      {page.is_featured && <span className="text-xs text-yellow-400">⭐ مميز</span>}
                      {page.is_archived && <span className="text-xs text-slate-500">📦 مؤرشف</span>}
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-1">{page.description}</p>
                    <div className="text-xs text-slate-500 mt-1 font-mono" dir="ltr">{page.code}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(page.status)}
                    <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 text-xs border border-sky-500/30">
                      {page.rate}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => openEdit(page)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs transition"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => handleAction(page.id, "change_status", page.status === "won" ? "lost" : page.status === "lost" ? "pending" : "won")}
                    className="px-3 py-1.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 text-xs border border-yellow-500/30 transition"
                  >
                    تغيير الحالة
                  </button>
                  <button
                    onClick={() => handleAction(page.id, "toggle_featured")}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs transition"
                  >
                    {page.is_featured ? "⭐ إلغاء التمييز" : "☆ تمييز"}
                  </button>
                  <button
                    onClick={() => handleAction(page.id, "toggle_archive")}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs transition"
                  >
                    {page.is_archived ? "📂 استعادة" : "📦 أرشفة"}
                  </button>
                  <button
                    onClick={() => handleDelete(page.id, page.name)}
                    className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs border border-red-500/30 transition"
                  >
                    🗑️ حذف
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
                {editingId ? "تعديل بكج" : "إضافة بكج جديد"}
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
                <label className="block text-sm text-slate-400 mb-2">الاسم *</label>
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
                <label className="block text-sm text-slate-400 mb-2">الكود *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:outline-none text-white font-mono transition"
                  required
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">التصنيف</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:outline-none text-white transition"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">الريت</label>
                  <input
                    type="text"
                    value={form.rate}
                    onChange={(e) => setForm({ ...form, rate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:outline-none text-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">عدد المباريات</label>
                <input
                  type="number"
                  value={form.matches_count}
                  onChange={(e) => setForm({ ...form, matches_count: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:outline-none text-white transition"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-slate-400 mb-2">
                  روابط الصور (اختياري)
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  ضع رابط الصورة، وإذا كان هناك أكثر من صورة افصل بينهم بفاصلة ( , )
                </p>
                <textarea
                  value={form.image_urls}
                  onChange={(e) =>
                    setForm({ ...form, image_urls: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:outline-none text-white transition font-mono text-sm"
                  dir="ltr"
                  rows={3}
                  placeholder="https://image1.jpg , https://image2.jpg"
                />
                {form.image_urls && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {form.image_urls.split(",").filter(url => url.trim() !== "").map((url, idx) => (
                      <div key={idx} className="w-20 h-20 rounded-lg overflow-hidden border border-slate-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url.trim()} alt="معاينة" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-900 font-bold transition"
                >
                  {saving ? "جاري الحفظ..." : editingId ? "حفظ التعديلات" : "إضافة البكج"}
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