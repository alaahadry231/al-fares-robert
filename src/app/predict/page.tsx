"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toPng } from "html-to-image";
import { trackView } from "@/lib/tracking";

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
  telegram_id: string;
  telegram_username: string;
  nickname: string;
};

type Prediction = {
  id: number;
  match_id: number;
  score1: number;
  score2: number;
  points: number;
  is_correct: boolean;
};

export default function PredictPage() {
  const router = useRouter();
  const receiptRef = useRef<HTMLDivElement>(null);

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<Player | null>(null);
  const [myPredictions, setMyPredictions] = useState<Prediction[]>([]);
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [score1, setScore1] = useState("");
  const [score2, setScore2] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [savedPrediction, setSavedPrediction] = useState<{
    match: Match;
    score1: number;
    score2: number;
  } | null>(null);
  const [savingImage, setSavingImage] = useState(false);

  useEffect(() => {
    trackView("/predict");

    const saved = localStorage.getItem("player_data");
    if (saved) {
      try {
        setPlayer(JSON.parse(saved));
      } catch {
        // نتجاهل
      }
    }

    const fetchMatches = async () => {
      try {
        const res = await fetch("/api/predict");
        const json = await res.json();
        setMatches(json.open || []);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  useEffect(() => {
    if (!player) return;

    const fetchMyPredictions = async () => {
      try {
        const res = await fetch(`/api/predict/my-predictions?player_id=${player.id}`);
        const json = await res.json();
        setMyPredictions(json.data || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchMyPredictions();
  }, [player]);

  const getPrediction = (matchId: number) => {
    return myPredictions.find((p) => p.match_id === matchId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMatch || !player) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/predict/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          match_id: activeMatch.id,
          player_id: player.id,
          score1: parseInt(score1),
          score2: parseInt(score2),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "فشل التوقع");
        setSubmitting(false);
        return;
      }

      setMyPredictions([
        ...myPredictions,
        {
          id: data.prediction.id,
          match_id: activeMatch.id,
          score1: parseInt(score1),
          score2: parseInt(score2),
          points: 0,
          is_correct: false,
        },
      ]);

      setSavedPrediction({
        match: activeMatch,
        score1: parseInt(score1),
        score2: parseInt(score2),
      });

      setActiveMatch(null);
      setScore1("");
      setScore2("");
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveImage = async () => {
    if (!receiptRef.current || !player || !savedPrediction) return;

    setSavingImage(true);
    try {
      const dataUrl = await toPng(receiptRef.current, {
        backgroundColor: "#0f172a",
        pixelRatio: 2,
        cacheBust: true,
      });

      const link = document.createElement("a");
      link.download = `prediction-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Screenshot error:", err);
      alert("تعذر حفظ الصورة، جرّب مرة أخرى");
    } finally {
      setSavingImage(false);
    }
  };

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

  const formatFullDate = (dateStr: string) => {
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

  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden py-10 md:py-16 text-center bg-gradient-to-b from-sky-500/10 to-slate-950">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-2xl md:text-5xl font-bold mb-3">
            🎯 توقع <span className="text-sky-400">واربح</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-lg">
            توقّع نتائج المباريات واحصل على نقاط
          </p>
          {player && (
            <div className="mt-4 inline-block px-4 py-2 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs md:text-sm">
              👋 أهلاً {player.nickname || "لاعب"} • ⭐ 0 نقطة
            </div>
          )}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-3 md:px-4 py-6 md:py-8">
        {loading ? (
          <div className="text-center py-20 text-slate-500">جاري التحميل...</div>
        ) : matches.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <div className="text-6xl mb-4">⚽</div>
            <p>لا توجد مباريات متاحة حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {matches.map((match) => {
              const prediction = getPrediction(match.id);

              return (
                <div
                  key={match.id}
                  className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex flex-col"
                >
                  <div className="bg-gradient-to-r from-sky-500/10 to-blue-500/10 border-b border-slate-800 p-3 text-center">
                    <div className="text-xs text-slate-400 truncate">
                      {match.league || "مباراة"}
                    </div>
                    <div className="text-xs text-sky-400 font-semibold mt-1">
                      {formatDate(match.match_date)}
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex-1 text-center min-w-0">
                        <div className="text-sm md:text-base font-bold truncate">{match.team1}</div>
                      </div>
                      <div className="text-slate-500 text-sm shrink-0">×</div>
                      <div className="flex-1 text-center min-w-0">
                        <div className="text-sm md:text-base font-bold truncate">{match.team2}</div>
                      </div>
                    </div>

                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 mb-3 text-center">
                      <div className="text-[10px] md:text-xs text-red-400 font-semibold leading-tight">
                        ⏰ تغلق: {formatDate(match.predictions_close_at)}
                      </div>
                    </div>

                    {prediction ? (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center mb-3 mt-auto">
                        <div className="text-xs text-green-400 font-semibold mb-1">
                          ✅ لقد توقعت
                        </div>
                        <div className="text-xl font-bold text-green-300">
                          {prediction.score1} - {prediction.score2}
                        </div>
                      </div>
                    ) : !player ? (
                      <Link
                        href="/login"
                        className="w-full mt-auto px-4 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-900 font-bold text-center text-sm transition"
                      >
                        سجّل دخول للتوقّع
                      </Link>
                    ) : (
                      <button
                        onClick={() => {
                          setActiveMatch(match);
                          setScore1("");
                          setScore2("");
                          setError("");
                        }}
                        className="w-full mt-auto px-4 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 active:bg-sky-400 text-slate-900 font-bold text-sm transition"
                      >
                        توقّع الآن
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* بطاقة التوقع الأخير (للحفظ) */}
        {savedPrediction && player && (
          <div className="max-w-md mx-auto mt-10 space-y-4">
            <h3 className="text-center text-sky-400 font-bold text-lg">📸 احفظ صورة توقعك</h3>

            <div
              ref={receiptRef}
              className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-2xl border-2 border-sky-500/50 p-6"
              dir="rtl"
            >
              <div className="text-center mb-6 pb-4 border-b border-slate-800">
                <div className="text-4xl mb-2">🎯</div>
                <div className="text-sky-400 font-bold text-xl">
                  Al Fares Robert
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  صورة توقع - توقع واربح
                </div>
              </div>

              <div className="bg-slate-900 rounded-xl p-4 mb-4 border border-slate-800 text-center">
                <div className="text-xs text-slate-500 mb-1">المباراة</div>
                <div className="text-lg font-bold text-white">
                  {savedPrediction.match.team1} × {savedPrediction.match.team2}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {savedPrediction.match.league || ""}
                </div>
              </div>

              <div className="bg-sky-500/10 rounded-xl p-4 mb-4 border border-sky-500/30 text-center">
                <div className="text-xs text-slate-400 mb-1">توقعك</div>
                <div className="text-3xl font-bold text-sky-400">
                  {savedPrediction.score1} - {savedPrediction.score2}
                </div>
              </div>

              <div className="bg-slate-900 rounded-xl p-4 mb-4 border border-slate-800 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">👤 اللاعب:</span>
                  <span className="text-white font-bold">{player.nickname || "لاعب"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">🆔 ID:</span>
                  <span className="text-white font-mono" dir="ltr">{player.telegram_id || "—"}</span>
                </div>
                {player.telegram_username && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">📩 تلغرام:</span>
                    <span className="text-sky-400 font-mono" dir="ltr">
                      @{player.telegram_username}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">📅 التاريخ:</span>
                  <span className="text-white text-xs">
                    {formatFullDate(savedPrediction.match.match_date)}
                  </span>
                </div>
              </div>

              <div className="text-center text-xs text-slate-600">
                📢 <span dir="ltr">@AlFaresRobert1</span>
              </div>
            </div>

            <button
              onClick={handleSaveImage}
              disabled={savingImage}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-slate-900 font-bold transition"
            >
              {savingImage ? "⏳ جاري الحفظ..." : "📸 احفظ الصورة"}
            </button>

            <button
              onClick={() => setSavedPrediction(null)}
              className="w-full px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm transition"
            >
              إغلاق
            </button>
          </div>
        )}
      </section>

      {/* Modal: Prediction Form */}
      {activeMatch && player && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 rounded-t-3xl sm:rounded-2xl border-t sm:border border-slate-800 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <h3 className="text-lg font-bold">توقع النتيجة</h3>
              <button
                onClick={() => setActiveMatch(null)}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-6">
              <div className="text-center">
                <div className="text-xs text-slate-400 mb-2">{activeMatch.league}</div>
                <div className="text-lg font-bold">
                  {activeMatch.team1} × {activeMatch.team2}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-center gap-4">
                <div className="flex-1 text-center">
                  <div className="text-sm text-slate-400 mb-3 truncate font-bold">{activeMatch.team1}</div>
                  <input
                    type="number"
                    value={score1}
                    onChange={(e) => setScore1(e.target.value)}
                    min="0"
                    max="50"
                    placeholder="0"
                    className="w-full max-w-[100px] h-24 mx-auto text-center text-4xl font-bold rounded-2xl bg-slate-950 border-2 border-slate-800 focus:border-sky-500 focus:outline-none text-white transition"
                    required
                  />
                </div>
                <div className="text-slate-500 text-2xl font-bold">-</div>
                <div className="flex-1 text-center">
                  <div className="text-sm text-slate-400 mb-3 truncate font-bold">{activeMatch.team2}</div>
                  <input
                    type="number"
                    value={score2}
                    onChange={(e) => setScore2(e.target.value)}
                    min="0"
                    max="50"
                    placeholder="0"
                    className="w-full max-w-[100px] h-24 mx-auto text-center text-4xl font-bold rounded-2xl bg-slate-950 border-2 border-slate-800 focus:border-sky-500 focus:outline-none text-white transition"
                    required
                  />
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-yellow-400 text-xs text-center">
                ⚠️ لا يمكن تعديل التوقع بعد التأكيد
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-6 py-4 rounded-xl bg-sky-500 hover:bg-sky-400 active:bg-sky-400 disabled:opacity-50 text-slate-900 font-bold transition text-lg"
                >
                  {submitting ? "جاري الإرسال..." : "تأكيد التوقع"}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMatch(null)}
                  className="w-full px-6 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition"
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