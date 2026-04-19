"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

type PokemonType = "きのみ" | "食材" | "スキル";

type Result = {
  pokemonName: string;
  type: string;
  nature: string;
  subskills: string[];
  reread: boolean;
  scores: { nature: number; subskill: number; total: number };
  grade: { label: string; color: string; emoji: string };
  comment: string;
};

type NeedsType = {
  error: "needsType";
  pokemonName: string;
  nature: string;
  subskills: unknown[];
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
  const [needsType, setNeedsType] = useState<NeedsType | null>(null);
  const [manualName, setManualName] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"good" | "bad" | null>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
    setManualName("");
    setFeedback(null);
    setNeedsType(null);
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const sendFeedback = async (reaction: "good" | "bad") => {
    if (!result || feedback) return;
    setFeedback(reaction);
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: result.type, nature: result.nature,
        subskills: result.subskills, score: result.scores.total,
        grade: result.grade.label, reaction,
      }),
    });
  };

  const shareUrl = result
    ? `https://pokemon-sleep-checker.vercel.app/share?name=${encodeURIComponent(manualName || result.pokemonName || "ポケモン")}&type=${encodeURIComponent(result.type)}&score=${encodeURIComponent(result.scores.total)}&grade=${encodeURIComponent(result.grade.label)}&nature=${encodeURIComponent(result.nature)}&subskills=${encodeURIComponent(result.subskills.join(","))}`
    : "";
  const shareText = result
    ? `【ポケスリ個体値チェッカー】\n${manualName || result.pokemonName || "ポケモン"}（${result.type}タイプ）\nスコア：${result.scores.total}点 ${result.grade.emoji}${result.grade.label}`
    : "";

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleAnalyze = async (typeOverride?: PokemonType) => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setNeedsType(null);
    try {
      const fd = new FormData();
      fd.append("image", file);
      if (typeOverride) fd.append("type", typeOverride);
      const res = await fetch("/api/analyze", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "エラーが発生しました");
      if (data.error === "needsType") {
        setNeedsType(data as NeedsType);
      } else {
        setResult(data);
      }
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

        {/* ヘルプバナー */}
        <Link href="/help" className="flex items-center justify-between glass-card rounded-2xl px-5 py-4 mb-4 border border-blue-400/20 hover:border-blue-400/50 hover:bg-blue-500/10 transition-all duration-300 animate-fadeInUp group" style={{ animationDelay: "0.05s" }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">📱</span>
            <div>
              <p className="text-sm font-bold text-white">スクショの撮り方がわからない？</p>
              <p className="text-xs text-slate-400">どの画面を撮ればいいか解説しています</p>
            </div>
          </div>
          <span className="text-blue-400 text-lg group-hover:translate-x-1 transition-transform">→</span>
        </Link>

        {/* スクショ */}
        <div className="glass-card rounded-2xl p-5 mb-4 animate-fadeInUp" style={{ animationDelay: "0.1s" }}>
          <p className="text-xs text-blue-300 font-bold uppercase tracking-widest mb-3">
            スクリーンショットをアップロード
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

        {/* ニックネーム用手入力（任意） */}
        <div className="glass-card rounded-2xl p-5 mb-4 animate-fadeInUp" style={{ animationDelay: "0.25s" }}>
          <p className="text-xs text-blue-300 font-bold uppercase tracking-widest mb-3">
            ポケモン名（任意）
            <span className="ml-2 text-slate-500 normal-case font-normal">ニックネームをつけている場合に入力</span>
          </p>
          <input
            type="text"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            placeholder="例：サーナイト"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-400/50 transition"
          />
        </div>

        {/* アフィリエイトバナー */}
        <div className="flex justify-center mb-4 overflow-hidden rounded-xl">
          <AffiliateBanner id={1} />
        </div>

        {/* タイプ不明時のセレクター */}
        {needsType && (
          <div className="glass-card rounded-2xl p-5 mb-4 animate-fadeInUp border border-yellow-400/30">
            <p className="text-xs text-yellow-300 font-bold mb-1">
              「{needsType.pokemonName || "このポケモン"}」の得意なものを選んでください
            </p>
            <p className="text-xs text-slate-400 mb-3">対応表に登録がないため手動選択が必要です</p>
            <div className="grid grid-cols-3 gap-3">
              {TYPE_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => handleAnalyze(t.value)}
                  className={`py-4 rounded-xl font-bold transition-all duration-300 border-2 border-white/10 bg-white/5 text-slate-300 hover:bg-white/10`}
                >
                  <div className="text-2xl mb-1">{t.emoji}</div>
                  <div className="text-sm">{t.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 採点ボタン */}
        <button
          onClick={() => handleAnalyze()}
          disabled={!file || loading}
          className={`w-full font-black py-4 rounded-xl text-lg transition-all duration-300 mb-6 ${
            file && !loading
              ? "bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 text-white shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02]"
              : "bg-white/5 text-slate-500 cursor-not-allowed"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">🔍</span> AI解析中...
            </span>
          ) : !file ? "スクショをアップロードしてください" : "✨ 採点する"}
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
              <p className="text-slate-400 text-xs mb-2 tracking-widest uppercase">
                {manualName || result.pokemonName || "ニックネームあり"} / {result.type}タイプ
              </p>
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
            {result.reread && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-xs text-yellow-200 mb-4">
                🔄 一部のサブスキルを色情報をもとに再読み取りしました
              </div>
            )}

            {result.comment && (
              <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-4 text-sm text-blue-100 leading-relaxed mb-4">
                💬 {result.comment}
              </div>
            )}

            {/* フィードバック */}
            <div className="bg-white/5 rounded-xl p-4 mb-4 text-center">
              {feedback ? (
                <p className="text-green-400 text-sm font-bold">
                  {feedback === "good" ? "👍 フィードバックありがとうございます！" : "👎 ご意見ありがとうございます！改善に役立てます。"}
                </p>
              ) : (
                <>
                  <p className="text-slate-400 text-xs mb-3">この採点は正確でしたか？</p>
                  <div className="flex gap-3 justify-center">
                    <button onClick={() => sendFeedback("good")}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl bg-green-500/20 border border-green-500/40 text-green-300 text-sm hover:bg-green-500/30 transition">
                      👍 正確だった
                    </button>
                    <button onClick={() => sendFeedback("bad")}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-sm hover:bg-red-500/30 transition">
                      👎 おかしかった
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* シェアボタン */}
            <div className="flex gap-2 mb-4">
              <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-black border border-white/20 text-white text-sm font-bold hover:bg-white/10 transition">
                𝕏 でシェア
              </a>
              <a href={`https://bsky.app/intent/compose?text=${encodeURIComponent(shareText + "\n" + shareUrl)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-600/30 border border-sky-400/40 text-sky-300 text-sm font-bold hover:bg-sky-600/40 transition">
                🦋 Blueskyでシェア
              </a>
            </div>

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

        {/* アフィリエイトバナー（結果後） */}
        {result && (
          <div className="flex justify-center mb-4 overflow-hidden rounded-xl">
            <AffiliateBanner id={2} />
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

        <footer className="text-center text-slate-600 text-xs mt-8 space-y-2">
          <div className="flex justify-center gap-4">
            <Link href="/help" className="text-blue-400 hover:text-blue-300 underline">📱 スクショの撮り方</Link>
            <Link href="/privacy" className="text-slate-500 hover:text-slate-400 underline">プライバシーポリシー</Link>
          </div>
          <p>© 2025 ポケスリ個体値チェッカー</p>
          <p>※非公式ファンサイトです。株式会社ポケモン・任天堂とは無関係です。</p>
        </footer>
      </div>
    </main>
  );
}

function AffiliateBanner({ id }: { id: 1 | 2 }) {
  if (id === 1) return (
    <div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <a href="https://px.a8.net/svt/ejp?a8mat=4B1O1T+7USX4I+53VQ+62ENL" rel="nofollow" target="_blank">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img style={{ border: 0 }} width={468} height={60} alt="" src="https://www29.a8.net/svt/bgt?aid=260418305475&wid=001&eno=01&mid=s00000023831001019000&mc=1" />
      </a>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img style={{ border: 0 }} width={1} height={1} src="https://www19.a8.net/0.gif?a8mat=4B1O1T+7USX4I+53VQ+62ENL" alt="" />
    </div>
  );
  return (
    <div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <a href="https://px.a8.net/svt/ejp?a8mat=4B1O1T+AHGV2Y+3QJC+669JL" rel="nofollow" target="_blank">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img style={{ border: 0 }} width={468} height={60} alt="" src="https://www25.a8.net/svt/bgt?aid=260418305634&wid=002&eno=01&mid=s00000017436001037000&mc=1" />
      </a>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img style={{ border: 0 }} width={1} height={1} src="https://www14.a8.net/0.gif?a8mat=4B1O1T+AHGV2Y+3QJC+669JL" alt="" />
    </div>
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
