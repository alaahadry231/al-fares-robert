export default function MaintenancePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-slate-950">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6 animate-bounce">🔧</div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-sky-400">
          الموقع تحت الصيانة
        </h1>
        
        <p className="text-slate-300 text-lg mb-8 leading-relaxed">
          نعمل حالياً على تحسينات جديدة لتجربة أفضل. 
          <br />
          سنعود قريباً جداً!
        </p>

        <div className="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-6 mb-8">
          <p className="text-sky-400 text-sm mb-4">
            تابعنا على قناتنا لمعرفة موعد العودة:
          </p>
          <a
            href="https://t.me/AlFaresRobert1"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-900 font-bold transition shadow-lg shadow-sky-500/25"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
            <span>قناة التلغرام</span>
          </a>
        </div>

        <a
          href="/admin"
          className="text-slate-600 hover:text-slate-400 text-xs transition"
        >
          دخول المدير
        </a>
      </div>
    </main>
  );
}