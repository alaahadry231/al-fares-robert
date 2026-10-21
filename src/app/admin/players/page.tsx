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
  ban_reason: string | null;
  ban_until: string | null;
  telegram_chat_id: string | null;
  created_at: string;
};

export default function AdminPlayers() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "banned" | "active">("all");

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Ban modal
  const [showBanModal, setShowBanModal] = useState(false);
  const [banningPlayer, setBanningPlayer] = useState<Player | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banning, setBanning] = useState(false);

  const fetchPlayers = async () => {
    try {
      const res = await fetch("/api/admin/players");
      const json = await res.json();
      setPlayers(json.data || []);
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
    fetchPlayers();
  }, [router]);

  const openEdit = (player: Player) => {
    setEditingPlayer(player);
    setEditName(player.nickname || "");
    setError("");
    setShowEditModal(true);
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer) return;

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/players/${editingPlayer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_name", nickname: editName }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "فشل التعديل");
        setSaving(false);
        return;
      }

      setShowEditModal(false);
      setEditingPlayer(null);
      await fetchPlayers();
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  };

  const openBan = (player: Player) => {
    setBanningPlayer(player);
    setBanReason("");
    setShowBanModal(true);
  };

  const handleBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banningPlayer) return;

    setBanning(true);

    try {
      const res = await fetch(`/api/admin/players/${banningPlayer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ban", ban_reason: banReason }),
      });

      if (!res.ok) {
        alert("فشل الحظر");
        return;
      }

      setShowBanModal(false);
      setBanningPlayer(null);
      await fetchPlayers();
    } catch {
      alert("تعذر الاتصال بالخادم");
    } finally {
      setBanning(false);
    }
  };

  const handleUnban = async (player: Player) => {
    if (!confirm(`هل أنت متأكد من فك الحظر عن "${player.nickname || player.telegram_username || player.telegram_id}"؟`)) return;

    try {
      const res = await fetch(`/api/admin/players/${player.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unban" }),
      });

      if (!res.ok) {
        alert("فشل فك الحظر");
        return;
      }

      await fetchPlayers();
    } catch {
      alert("تعذر الاتصال بالخادم");
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString("ar-EG", {
        year: "numeric",
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

  const filtered = players.filter((p) => {
    const name = p.nickname || p.telegram_username || p.telegram_id;
    const matchesSearch = name.includes(search) || p.telegram_id.includes(search);
    
    if (filter === "banned") return matchesSearch && p.is_banned;
    if (filter === "active") return matchesSearch && !p.is_banned;
    return matchesSearch;
  });

  const bannedCount = players.filter((p) => p.is_banned).length;
  const activeCount = players.length - bannedCount;

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
            <Link href="/admin/dashboard" className="text-slate-400 hover:text-sky-400 text-2xl">←</Link>
            <h1 className="text-lg font-bold">إدارة اللاعبين</h1>
          </div>
          <button
            onClick={fetchPlayers}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm transition"
          >
            🔄 تحديث
          </button>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-3 md:px-4 py-6">
        {/* بحث وفلترة */}
        <div className="flex flex-col sm:flex-row gap-2 mb-6">
          <input
            type="text"
            placeholder="ابحث بالاسم أو ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 focus:border-sky-500 focus:outline-none text-white text-base transition"
          />
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setFilter("all")}
              className={`flex-1 sm:flex-none px-4 py-3 rounded-xl text-xs font-semibold transition ${
                filter === "all"
                  ? "bg-sky-500 text-slate-900"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              الكل ({players.length})
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`flex-1 sm:flex-none px-4 py-3 rounded-xl text-xs font-semibold transition ${
                filter === "active"
                  ? "bg-green-500 text-white"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              ✅ نشط ({activeCount})
            </button>
            <button
              onClick={() => setFilter("banned")}
              className={`flex-1 sm:flex-none px-4 py-3 rounded-xl text-xs font-semibold transition ${
                filter === "banned"
                  ? "bg-red-500 text-white"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              🚫 محظور ({bannedCount})
            </button>
          </div>
        </div>

        {/* قائمة اللاعبين */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <div className="text-6xl mb-4">👥</div>
            <p>لا يوجد لاعبين بهذا الفلتر</p>
          </div>
        ) : (
          <>
            {/* عرض البطاقات للموبايل */}
            <div className="md:hidden space-y-3">
              {filtered.map((player) => (
                <div
                  key={player.id}
                  className={`bg-slate-900 rounded-2xl border p-4 ${
                    player.is_banned ? "border-red-500/30" : "border-slate-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-base">
                          {player.nickname || "بدون اسم"}
                        </span>
                        {player.is_banned && (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] border border-red-500/30">
                            🚫 محظور
                          </span>
                        )}
                        {player.telegram_chat_id && (
                          <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] border border-green-500/30">
                            🔗 مربوط
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 space-y-0.5">
                        {player.telegram_username && (
                          <div dir="ltr" className="text-sky-400 font-mono">
                            @{player.telegram_username}
                          </div>
                        )}
                        <div dir="ltr" className="font-mono">
                          ID: {player.telegram_id}
                        </div>
                        <div>📅 {formatDate(player.created_at)}</div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xl font-bold text-sky-400">
                        {player.total_points.toLocaleString("ar-EG")}
                      </div>
                      <div className="text-[10px] text-slate-500">نقطة</div>
                    </div>
                  </div>

                  {player.is_banned && player.ban_reason && (
                    <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
                      <b>سبب الحظر:</b> {player.ban_reason}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(player)}
                      className="flex-1 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
                    >
                      ✏️ تعديل
                    </button>
                    {player.is_banned ? (
                      <button
                        onClick={() => handleUnban(player)}
                        className="flex-1 px-3 py-2.5 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-semibold border border-green-500/30 transition"
                      >
                        ✅ فك الحظر
                      </button>
                    ) : (
                      <button
                        onClick={() => openBan(player)}
                        className="flex-1 px-3 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/30 transition"
                      >
                        🚫 حظر
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* عرض الجدول للكمبيوتر */}
            <div className="hidden md:block bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-950 border-b border-slate-800">
                  <tr>
                    <th className="text-right px-4 py-3 text-sm text-slate-400 font-semibold">اللاعب</th>
                    <th className="text-right px-4 py-3 text-sm text-slate-400 font-semibold">ID تلغرام</th>
                    <th className="text-right px-4 py-3 text-sm text-slate-400 font-semibold">النقاط</th>
                    <th className="text-right px-4 py-3 text-sm text-slate-400 font-semibold">الحالة</th>
                    <th className="text-right px-4 py-3 text-sm text-slate-400 font-semibold">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((player) => (
                    <tr key={player.id} className="border-b border-slate-800 last:border-0">
                      <td className="px-4 py-3">
                        <div className="font-semibold">{player.nickname || "بدون اسم"}</div>
                        {player.telegram_username && (
                          <div className="text-xs text-sky-400 font-mono" dir="ltr">@{player.telegram_username}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-slate-300" dir="ltr">{player.telegram_id}</td>
                      <td className="px-4 py-3 font-bold text-sky-400">{player.total_points.toLocaleString("ar-EG")}</td>
                      <td className="px-4 py-3">
                        {player.is_banned ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs border border-red-500/30">🚫 محظور</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs border border-green-500/30">✅ نشط</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(player)} className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs transition">تعديل</button>
                          {player.is_banned ? (
                            <button onClick={() => handleUnban(player)} className="px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs border border-green-500/30 transition">فك الحظر</button>
                          ) : (
                            <button onClick={() => openBan(player)} className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs border border-red-500/30 transition">حظر</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Modal تعديل الاسم */}
      {showEditModal && editingPlayer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 rounded-t-3xl sm:rounded-2xl border-t sm:border border-slate-800 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <h3 className="text-xl font-bold">تعديل اسم اللاعب</h3>
              <button onClick={() => setShowEditModal(false)} className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition flex items-center justify-center">✕</button>
            </div>

            <form onSubmit={handleSaveName} className="p-5 space-y-4">
              {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}
              <div>
                <label className="block text-sm text-slate-400 mb-2">الاسم الجديد</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-4 py-4 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:outline-none text-white transition" placeholder="اكتب الاسم..." required />
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <button type="submit" disabled={saving} className="w-full px-6 py-4 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-900 font-bold transition">{saving ? "جاري الحفظ..." : "حفظ"}</button>
                <button type="button" onClick={() => setShowEditModal(false)} className="w-full px-6 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal حظر */}
      {showBanModal && banningPlayer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 rounded-t-3xl sm:rounded-2xl border-t sm:border border-slate-800 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <h3 className="text-xl font-bold">حظر اللاعب</h3>
              <button onClick={() => setShowBanModal(false)} className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition flex items-center justify-center">✕</button>
            </div>

            <form onSubmit={handleBan} className="p-5 space-y-4">
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">⚠️ سيتم حظر اللاعب لمدة 30 يوماً من تاريخ اليوم.</div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">سبب الحظر</label>
                <input type="text" value={banReason} onChange={(e) => setBanReason(e.target.value)} className="w-full px-4 py-4 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:outline-none text-white transition" placeholder="مثال: مخالفة الشروط..." />
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <button type="submit" disabled={banning} className="w-full px-6 py-4 rounded-xl bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white font-bold transition">{banning ? "جاري الحظر..." : "🚫 تأكيد الحظر"}</button>
                <button type="button" onClick={() => setShowBanModal(false)} className="w-full px-6 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}