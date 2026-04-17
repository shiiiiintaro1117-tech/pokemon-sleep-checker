"use client";

import { useState, useCallback } from "react";
import Image from "next/image";

type PokemonType = "きのみ" | "食材" | "スキル";

type Result = {
  pokemonName: string;
  type: string;
  nature: string;
  subskills: string[];
  scores: { nature: number; subskill: number; total: number };
  grade: { label: string; color: string; emoji: string };
  comment: string;
};

const TYPE_OPTIONS: { value: PokemonType; emoji: string; label: string; color: string }[] = [
  { value: "きのみ", emoji: "🍓", label: "きのみ", color: "from-pink-600 to-rose-500" },
  { value: "食材", emoji: "🥕", label: "食材", color: "from-orange-600 to-amber-500" },
  { value: "スキル", emoji: "✨", label: "スキル", color: "from-violet-600 to-purple-500" },
];

const GRADE_CONFIG = {
  マスター: { bg: "from-yellow-400 to-amber-300", glow: "glow-gold", ring: "ring-yellow-400", text: "text-yellow-300" },
  ハイパー: { bg: "from-purple-500 to-violet-400", glow: "glow-purple", ring: "ring-purple-400", text: "text-purple-300" },
  スーパー: { bg: "from-blue-500 to-cyan-400", glow: "glow-blue", ring: "ring-blue-400", text: "text-blue-300" },
  ノーマル: { bg: "from-slate-500 to-slate-400", glow: "", ring: "ring-slate-400", text: "text-slate-300" },
};

function StarField() {
  const stars = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    size: Math.random() * 2.5 + 0.5,
    top: Math.random() * 100,
    left: Math.random() * 100,
    delay: Math.random() * 4,
    duration: Math.random() * 3 + 2,
  }));
  return (
    <div className="stars-container">
      {stars.map((s) => (
        <div
          key={s.id}
          className="star"
          style={{
            width: s.size,
            height: s.size,
            top: `${s.top}%`,
            left: `${s.left}%`,
            animation: `twinkle ${s.duration}s ${s.delay}s ease-in-out infinite`,
            opacity: 0.3,
          }}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [selectedType, setSelectedType] = useState<PokemonType | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleAnalyze = async () => {
    if (!file || !selectedType) return;
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("type", selectedType);
      const res = await fetch("/api/analyze", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "エラーが発生しました");
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const gradeConfig = result ? GRADE_CONFIG[result.grade.label as keyof typeof GRADE_CONFIG] : null;

  return (
    <main className="relative min-h-screen overflow-x-hidden" style={{ background: "linear-gradient(160deg, #0a0f2e 0%, #0d1b4b 40%, #1a0a3e 100%)" }}>
      <StarField />

      <div className="relative z-10 max-w-xl mx-auto px-4 py-10">

        {/* ヘッダー */}
        <div className="text-center mb-10 animate-fadeInUp">
          <div className="text-6xl mb-3 animate-float inline-block">🌙</div>
          <h1 className="text-3xl font-black mb-2 tracking-tight">
            <span className="shimmer-text">ポケスリ個体値チェッカー</span>
          </h1>
          <p className="text-blue-300 text-sm">スクショを貼るだけで個体を自動採点！</p>
        </div>

        {/* ステップ1：タイプ選択 */}
        <div className="glass-card rounded-2xl p-5 mb-4 animate-fadeInUp" style={{ animationDelay: "0.1s" }}>
          <p className="text-xs text-blue-300 font-bold uppercase tracking-widest mb-3">
            Step 1 — 得意なものを選択
          </p>
          <div className="grid grid-cols-3 gap-3">
            {TYPE_OPTIONS.map((t) => (
              <button
                key={t.value}
                onClick={() => { setSelectedType(t.value); setResult(null); }}
                className={`py-4 rounded-xl font-bold transition-all duration-300 border-2 ${
                  selectedType === t.value
                    ? `bg-gradient-to-b ${t.color} border-transparent shadow-lg scale-105`
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:scale-102"
                }`}
              >
                <div className="text-2xl mb-1">{t.emoji}</div>
                <div className="text-sm">{t.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ステップ2：スクショ */}
        <div className="glass-card rounded-2xl p-5 mb-4 animate-fadeInUp" style={{ animationDelay: "0.2s" }}>
          <p className="text-xs text-blue-300 font-bold uppercase tracking-widest mb-3">
            Step 2 — スクリーンショットをアップロード
          </p>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-blue-500/40 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400/70 hover:bg-blue-500/5 transition-all duration-300"
            onClick={() => document.getElementById("fileInput")?.click()}
          >
            {image ? (
              <Image src={image} alt="preview" width={400} height={300} className="mx-auto rounded-lg max-h-52 object-contain" />
            ) : (
              <div className="py-7">
                <div className="text-4xl mb-3">📱</div>
                <p className="text-blue-200 text-sm font-medium">ドロップ、またはタップして選択</p>
                <p className="text-blue-400/60 text-xs mt-1">性格・サブスキルが映っている画面</p>
              </div>
            )}
            <input id="fileInput" type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>
        </div>

        {/* 広告スペース */}
        <div className="glass-card rounded-xl p-3 text-center text-slate-600 text-xs mb-4 border border-white/5">
          広告スペース
        </div>

        {/* 採点ボタン */}
        <button
          onClick={handleAnalyze}
          disabled={!file || !selectedType || loading}
          className={`w-full font-black py-4 rounded-xl text-lg transition-all duration-300 mb-6 ${
            file && selectedType && !loading
              ? "bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 text-white shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02]"
              : "bg-white/5 text-slate-500 cursor-not-allowed"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">🔍</span> AI解析中...
            </span>
          ) : !selectedType ? "① 得意なものを選んでください" : !file ? "② スクショをアップロードしてください" : "✨ 採点する"}
        </button>

        {/* エラー */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 text-red-300 mb-4 whitespace-pre-line text-sm animate-fadeInUp">
            ⚠️ {error}
          </div>
        )}

        {/* 結果 */}
        {result && gradeConfig && (
          <div className={`glass-card rounded-2xl p-6 mb-6 ring-1 ${gradeConfig.ring} ${gradeConfig.glow} animate-fadeInUp`}>

            {/* スコア */}
            <div className="text-center mb-6">
              <p className="text-slate-400 text-xs mb-2 tracking-widest uppercase">{result.pokemonName} / {result.type}タイプ</p>
              <div className={`text-7xl font-black mb-2 animate-scoreCount bg-gradient-to-b ${gradeConfig.bg} bg-clip-text text-transparent`}>
                {result.scores.total}
              </div>
              <div className={`text-xl font-bold ${gradeConfig.text}`}>
                {result.grade.emoji} {result.grade.label}
              </div>
            </div>

            {/* スコア内訳 */}
            <div className="space-y-4 mb-5">
              <ScoreBar label="性格" value={result.scores.nature} max={25} detail={result.nature} color="from-pink-500 to-rose-400" />
              <ScoreBar label="サブスキル" value={result.scores.subskill} max={75} detail={result.subskills.join(" / ")} color="from-blue-500 to-cyan-400" />
            </div>

            {/* コメント */}
            {result.comment && (
              <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-4 text-sm text-blue-100 leading-relaxed mb-4">
                💬 {result.comment}
              </div>
            )}

            {/* グレードガイド */}
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(GRADE_CONFIG).map(([label, cfg]) => (
                <div key={label} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${result.grade.label === label ? `bg-white/10 ring-1 ${cfg.ring}` : "opacity-30"}`}>
                  <span>{label === "マスター" ? "👑" : label === "ハイパー" ? "💎" : label === "スーパー" ? "⭐" : "🔰"}</span>
                  <span className={`font-bold text-sm ${cfg.text}`}>{label}</span>
                  <span className="text-slate-400 text-xs ml-auto">{label === "マスター" ? "80〜" : label === "ハイパー" ? "60〜" : label === "スーパー" ? "40〜" : "〜39"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 採点基準 */}
        <div className="glass-card rounded-2xl p-5 text-sm animate-fadeInUp" style={{ animationDelay: "0.3s" }}>
          <h2 className="font-bold text-blue-300 mb-2 flex items-center gap-2">
            <span>📊</span> 採点基準について
          </h2>
          <p className="text-slate-400 leading-relaxed text-xs">
            各種攻略情報をもとに、性格（25点）・サブスキル（75点）の合計100点で評価。食材は読み取り精度の観点から評価対象外としています。タイプに合った性格・サブスキルを持つほど高得点になります。
          </p>
        </div>

        <footer className="text-center text-slate-600 text-xs mt-8 space-y-1">
          <p>© 2025 ポケスリ個体値チェッカー</p>
          <p>※非公式ファンサイトです。株式会社ポケモン・任天堂とは無関係です。</p>
          <a href="/privacy" className="text-slate-500 hover:text-slate-400 underline">プライバシーポリシー</a>
        </footer>
      </div>
    </main>
  );
}

function ScoreBar({ label, value, max, detail, color }: {
  label: string; value: number; max: number; detail: string; color: string;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400 font-medium">{label}</span>
        <span className="text-white font-bold">{value}<span className="text-slate-500">/{max}</span></span>
      </div>
      <div className="bg-white/5 rounded-full h-2.5 mb-1 overflow-hidden">
        <div
          className={`bg-gradient-to-r ${color} h-2.5 rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-slate-500 text-xs">{detail}</p>
    </div>
  );
}
