"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminDashboard() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  
  // حالة الصيانة
  const [maintenanceMode, setMaintenanceMode] = useState<boolean | null>(null);
  const [togglingMaintenance, setTogglingMaintenance] = useState(false);

  // حالة المسح (Reset)
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [resetting, setResetting] = useState(false);

  const fetchMaintenanceStatus = async () => {
    try {
      const res = await fetch("/api/admin/maintenance");
      const json = await res.json();
      setMaintenanceMode(json.enabled ?? false);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleMaintenance = async () => {
    if (togglingMaintenance || maintenanceMode === null) return;

    const newState = !maintenanceMode;
    const confirmMessage = newState
      ? "هل أنت متأكد من تفعيل الصيانة؟ الموقع رح يتوقف للزوار (اللاعبين المسجلين رح يقدروا يفوتوا)."
      : "هل أنت متأكد من إيقاف الصيانة؟ الموقع رح يرجع يشتغل للكل.";

    if (!confirm(confirmMessage)) return;

    setTogglingMaintenance(true);
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: newState }),
      });
      if (!res.ok) {
        alert("فشل التحديث");
        return;
      }
      setMaintenanceMode(newState);
    } catch {
      alert("تعذر الاتصال بالخادم");
    } finally {
      setTogglingMaintenance(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetConfirmText !== "مسح") {
      alert("يجب كتابة كلمة 'مسح' بالضبط");
      return;
    }

    setResetting(true);
    try {
      const res = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmText: resetConfirmText }),
      });

      if (!res.ok) {
        alert("فشل المسح");
        return;
      }

      alert("✅ تم مسح جميع البيانات بنجاح! الموقع رجع للصفر.");
      setShowResetModal(false);
      setResetConfirmText("");
    } catch {
      alert("تعذر الاتصال بالخادم");
    } finally {
      setResetting(false);
    }
  };

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("admin_logged_in");
    if (!isLoggedIn) {
      router.push("/admin");
    } else {
      setIsChecking(false);
      fetchMaintenanceStatus();
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
        {/* Maintenance Control Card */}
        <div
          className={`mb-4 rounded-2xl border-2 p-5 flex items-center justify-between flex-wrap gap-4 transition ${
            maintenanceMode
              ? "bg-yellow-500/5 border-yellow-500/30"
              : "bg-green-500/5 border-green-500/30"
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                maintenanceMode
                  ? "bg-yellow-500/20 border border-yellow-500/40"
                  : "bg-green-500/20 border border-green-500/40"
              }`}
            >
              {maintenanceMode ? "🔧" : "✅"}
            </div>
            <div>
              <div className="text-sm text-slate-400 mb-1">حالة الموقع</div>
              <div
                className={`text-base font-bold ${
                  maintenanceMode ? "text-yellow-400" : "text-green-400"
                }`}
              >
                {maintenanceMode === null
                  ? "جاري التحميل..."
                  : maintenanceMode
                  ? "🔧 تحت الصيانة (الزوار ممنوعين)"
                  : "✅ الموقع يعمل بشكل طبيعي"}
              </div>
            </div>
          </div>

          <button
            onClick={toggleMaintenance}
            disabled={togglingMaintenance || maintenanceMode === null}
            className={`px-6 py-3 rounded-xl font-bold text-white transition whitespace-nowrap ${
              maintenanceMode
                ? "bg-green-500 hover:bg-green-400"
                : "bg-yellow-500 hover:bg-yellow-400 text-slate-900"
            } disabled:opacity-50`}
          >
            {togglingMaintenance
              ? "جاري التحديث..."
              : maintenanceMode
              ? "✅ إيقاف الصيانة"
              : "🔧 تفعيل الصيانة"}
          </button>
        </div>

        {/* Danger Zone Card */}
        <div className="mb-8 rounded-2xl border-2 border-red-500/30 bg-red-500/5 p-5 flex items-center justify-between flex-wrap gap-4 transition">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl bg-red-500/20 border border-red-500/40">
              🗑️
            </div>
            <div>
              <div className="text-sm text-slate-400 mb-1">منطقة الخطر</div>
              <div className="text-base font-bold text-red-400">
                تصفير الموقع بالكامل (مسح كل البيانات)
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setShowResetModal(true);
              setResetConfirmText("");
            }}
            className="px-6 py-3 rounded-xl font-bold text-white transition whitespace-nowrap bg-red-500 hover:bg-red-400"
          >
            🗑️ تصفير الموقع
          </button>
        </div>

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

          {/* Trusted Bots */}
          <Link
            href="/admin/trusted-bots"
            className="bg-slate-900 rounded-2xl border border-slate-800 hover:border-sky-500/50 p-6 transition group"
          >
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-2xl mb-4">
              🤖
            </div>
            <h3 className="text-lg font-bold mb-1 group-hover:text-sky-400 transition">
              البوتات الموثوقة
            </h3>
            <p className="text-slate-400 text-sm">إدارة بوتات Ichancy</p>
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

      {/* Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border-2 border-red-500/50 w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="text-xl font-bold text-red-400">⚠️ تصفير الموقع</h3>
              <button
                onClick={() => setShowResetModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReset} className="p-5 space-y-4">
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm leading-relaxed">
                <b>تحذير:</b> هذا الإجراء سيقوم بمسح <b>كل</b> البيانات (اللاعبين، البكجات، المباريات، التوقعات، الأكواد، والجوائز) نهائياً. 
                <br />
                لا يمكن التراجع عن هذه الخطوة!
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  للتأكيد، اكتب كلمة <b className="text-red-400">مسح</b> في الحقل التالي:
                </label>
                <input
                  type="text"
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-red-500 focus:outline-none text-white text-center transition"
                  placeholder="مسح"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={resetting || resetConfirmText !== "مسح"}
                  className="flex-1 px-6 py-3 rounded-xl bg-red-500 hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition"
                >
                  {resetting ? "جاري المسح..." : "🗑️ تأكيد المسح"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
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