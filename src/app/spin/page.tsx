"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

type Prize = {
  type: "win" | "retry" | "lose";
  amount: number;
  label: string;
};

type Player = {
  id: number;
  nickname: string;
  total_points: number;
};

const prizes = [
  { label: "حظ أوفر", color: "#1e293b", type: "lose" },
  { label: "محاولة أخرى", color: "#075985", type: "retry" },
  { label: "5,000", color: "#0ea5e9", type: "win" },
  { label: "10,000", color: "#1e293b", type: "win" },
  { label: "15,000", color: "#0284c7", type: "win" },
  { label: "25,000", color: "#1e293b", type: "win" },
  { label: "50,000", color: "#0369a1", type: "win" },
  { label: "75,000", color: "#1e293b", type: "win" },
  { label: "100,000", color: "#0c4a6e", type: "win" },
];

const TELEGRAM_CONTACT = "https://t.me/AlFaresRobert";

export default function SpinPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const animationRef = useRef<number | null>(null);

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Prize | null>(null);
  const [error, setError] = useState("");
  const [retryCode, setRetryCode] = useState<string>("");
  const [player, setPlayer] = useState<Player | null>(null);

  const segmentAngle = (Math.PI * 2) / prizes.length;

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

  const drawWheel = (rot: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 10;

    ctx.clearRect(0, 0, size, size);

    ctx.beginPath();
    ctx.arc(center, center, radius + 6, 0, Math.PI * 2);
    ctx.fillStyle = "#0ea5e9";
    ctx.fill();

    prizes.forEach((prize, i) => {
      const startAngle = i * segmentAngle + rot;
      const endAngle = startAngle + segmentAngle;

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = prize.color;
      ctx.fill();

      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + segmentAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px Cairo, sans-serif";
      ctx.fillText(prize.label, radius - 20, 6);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(center, center, 40, 0, Math.PI * 2);
    ctx.fillStyle = "#0f172a";
    ctx.fill();
    ctx.strokeStyle = "#0ea5e9";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = "#0ea5e9";
    ctx.font = "bold 24px Cairo, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🎯", center, center);
  };

  useEffect(() => {
    drawWheel(0);
  }, []);

  const spinToPrize = (prizeIndex: number, onComplete: () => void) => {
    const segmentCenter = prizeIndex * segmentAngle + segmentAngle / 2;
    const targetRotation = -segmentCenter;

    const currentRotation = rotationRef.current;
    const fullTurns = 6 + Math.floor(Math.random() * 3);

    const currentMod =
      ((currentRotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const targetMod =
      ((targetRotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

    let delta = targetMod - currentMod;
    delta = ((delta % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    delta += fullTurns * Math.PI * 2;

    const startRotation = currentRotation;
    const endRotation = currentRotation + delta;
    const duration = 5000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = startRotation + (endRotation - startRotation) * eased;

      rotationRef.current = current;
      drawWheel(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        rotationRef.current = endRotation;
        onComplete();
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const handleSpin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !player) return;

    setLoading(true);
    setError("");
    setResult(null);

    const currentCode = code.trim();

    try {
      const res = await fetch("/api/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: currentCode, player_id: player.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "فشل التحقق");
        setLoading(false);
        return;
      }

      const prizeLabel = data.prize.label;
      let prizeIndex = prizes.findIndex(
        (p) =>
          p.label === prizeLabel ||
          (prizeLabel.startsWith("5,000") && p.label === "5,000") ||
          (prizeLabel.startsWith("10,000") && p.label === "10,000") ||
          (prizeLabel.startsWith("15,000") && p.label === "15,000") ||
          (prizeLabel.startsWith("25,000") && p.label === "25,000") ||
          (prizeLabel.startsWith("50,000") && p.label === "50,000") ||
          (prizeLabel.startsWith("75,000") && p.label === "75,000") ||
          (prizeLabel.startsWith("100,000") && p.label === "100,000")
      );

      if (prizeIndex === -1) prizeIndex = 0;

      spinToPrize(prizeIndex, () => {
        setResult(data.prize);
        if (data.prize.type === "retry") {
          setRetryCode(currentCode);
          setCode(currentCode);
        } else {
          setCode("");
          setRetryCode("");
        }
        setLoading(false);
      });
    } catch {
      setError("تعذر الاتصال بالخادم");
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden py-12 text-center bg-gradient-to-b from-sky-500/10 to-slate-950">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl md:text-5xl font-bold mb-3">
            🎡 عجلة <span className="text-sky-400">الحظ</span>
          </h1>
          <p className="text-slate-400 text-lg">جرّب حظك واربح جوائز نقدية</p>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-4 py-8">
        {/* Wheel */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute top-1/2 -right-2 -translate-y-1/2 z-10 pointer-events-none">
              <div
                className="w-0 h-0"
                style={{
                  borderTop: "15px solid transparent",
                  borderBottom: "15px solid transparent",
                  borderRight: "30px solid #0ea5e9",
                  filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.5))",
                }}
              ></div>
            </div>

            <canvas
              ref={canvasRef}
              width={450}
              height={450}
              className="max-w-full h-auto"
            />
          </div>
        </div>

        {/* Login required */}
        {!player ? (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-xl font-bold mb-2">يجب تسجيل الدخول</h3>
            <p className="text-slate-400 text-sm mb-6">
              سجّل دخولك بتلغرام لتتمكن من لف العجلة والفوز بالجوائز
            </p>
            <Link
              href="/login"
              className="inline-block px-8 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-900 font-bold transition"
            >
              تسجيل الدخول
            </Link>
          </div>
        ) : !result ? (
          <form
            onSubmit={handleSpin}
            className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4"
          >
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🔑</div>
              <h3 className="text-xl font-bold mb-1">
                {retryCode ? "محاولة أخرى!" : "أدخل كود العجلة"}
              </h3>
              <p className="text-slate-400 text-sm">
                {retryCode ? "اضغط دوّر العجلة لاستخدام نفس الكود" : "اكتب الكود الذي حصلت عليه"}
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            {retryCode && (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm text-center">
                🔄 محاولة إضافية مجانية!
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABCD1234"
                maxLength={20}
                dir="ltr"
                className="flex-1 px-5 py-3.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:outline-none text-white placeholder:text-slate-600 font-mono text-lg tracking-widest text-center transition"
                disabled={loading || !!retryCode}
              />
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-900 font-bold transition whitespace-nowrap"
              >
                {loading ? "جاري الدوران..." : retryCode ? "🔄 دوّر مرة أخرى" : "دوّر العجلة"}
              </button>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <p className="text-slate-400 text-sm text-center">
                ليس لديك كود؟{" "}
                <a
                  href={TELEGRAM_CONTACT}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 hover:text-sky-300 font-semibold underline underline-offset-4"
                >
                  تواصل معنا عبر تلغرام
                </a>
              </p>
            </div>
          </form>
        ) : (
          <div
            className={`bg-slate-900 rounded-2xl border-2 p-8 text-center ${
              result.type === "win"
                ? "border-green-500/50 bg-green-500/5"
                : result.type === "retry"
                ? "border-yellow-500/50 bg-yellow-500/5"
                : "border-slate-700"
            }`}
          >
            <div className="text-6xl mb-4">
              {result.type === "win" ? "🎉" : result.type === "retry" ? "🔄" : "😢"}
            </div>
            <div className="text-sm text-slate-400 mb-2">
              {result.type === "win" && "مبروك! ربحت"}
              {result.type === "retry" && "محاولة أخرى!"}
              {result.type === "lose" && "حظ أوفر"}
            </div>
            <div
              className={`text-4xl font-bold mb-6 ${
                result.type === "win"
                  ? "text-green-400"
                  : result.type === "retry"
                  ? "text-yellow-400"
                  : "text-slate-400"
              }`}
            >
              {result.type === "retry" ? "لف مرة أخرى" : result.label}
            </div>

            {result.type === "retry" && (
              <p className="text-sm text-yellow-300 mb-4">
                🎁 حصلت على محاولة إضافية مجانية!
              </p>
            )}

            {result.type === "win" && (
              <div className="space-y-3">
                <p className="text-sm text-slate-300">
                  تم حفظ الجائزة في حسابك! تواصل معنا على تلغرام لاستلامها.
                </p>
                <a
                  href={TELEGRAM_CONTACT}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-8 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-900 font-bold transition"
                >
                  📩 التواصل على تلغرام
                </a>
              </div>
            )}

            <button
              onClick={() => {
                setResult(null);
                setError("");
                if (result.type !== "retry") {
                  setCode("");
                  setRetryCode("");
                }
              }}
              className={`mt-6 px-6 py-2 rounded-lg text-sm transition ${
                result.type === "retry"
                  ? "bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold"
                  : "bg-slate-800 hover:bg-slate-700 text-white"
              }`}
            >
              {result.type === "retry" ? "🔄 لف مرة أخرى" : "العودة"}
            </button>
          </div>
        )}

        {/* Prizes List */}
        <div className="mt-8 bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <h3 className="font-bold mb-4 text-sky-400 text-center">
            🎁 الجوائز المحتملة
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {prizes.map((prize, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 p-2 rounded-lg border text-sm ${
                  prize.type === "win"
                    ? "bg-green-500/5 border-green-500/20 text-green-400"
                    : prize.type === "retry"
                    ? "bg-yellow-500/5 border-yellow-500/20 text-yellow-400"
                    : "bg-slate-800/50 border-slate-700 text-slate-400"
                }`}
              >
                <span className="text-base">
                  {prize.type === "win" ? "🎉" : prize.type === "retry" ? "🔄" : "😢"}
                </span>
                <span className="font-semibold text-xs">
                  {prize.type === "win" ? `${prize.label} ل.س` : prize.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Rules */}
        <div className="mt-6 bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <h3 className="font-bold mb-3 text-sky-400">📋 قواعد العجلة:</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>• كل كود يُستخدم مرة واحدة فقط</li>
            <li>• الجوائز تُسلّم عبر تلغرام</li>
            <li>• في حالة "محاولة أخرى"، يمكن استخدام الكود مجدداً</li>
            <li>• لا يمكن استرداد الأكواد المستخدمة</li>
            <li>• يجب تسجيل الدخول بتلغرام قبل اللعب</li>
          </ul>
        </div>
      </section>
    </main>
  );
}