"use client";

import { useState, useCallback, lazy, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { calculateEnergyEstimate, getDefaultIngredientSet, getIngredientSet, getPokemonEnergyData, INGREDIENT_ENERGY } from "@/lib/energy";
import type { EnergyBreakdown, IngredientName, IngredientSet, IngredientSlot, PokemonEnergyData } from "@/lib/energy";
import { encodeSubskills, encodeType, encodeGrade, encodeNature, encodePokemon } from "@/lib/shareParams";

const SharePreviewModal = lazy(() => import("@/components/SharePreviewModal"));

type PokemonType = "きのみ" | "食材" | "スキル";

type Result = {
  pokemonName: string;
  type: string;
  nature: string;
  subskills: string[];
  subskillDetails: { name: string; score: number }[];
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

const TYPE_OPTIONS: { value: PokemonType; emoji: string; label: string }[] = [
  { value: "きのみ", emoji: "🍓", label: "きのみ" },
  { value: "食材", emoji: "🥕", label: "食材" },
  { value: "スキル", emoji: "✨", label: "スキル" },
];

const GRADE_CONFIG = {
  マスター: {
    bg: "from-yellow-300 to-amber-400",
    ring: "ring-yellow-400/60",
    text: "text-yellow-300",
    glow: "glow-gold",
    pill: "bg-yellow-400/10 border-yellow-400/40 text-yellow-300",
  },
  ハイパー: {
    bg: "from-purple-400 to-fuchsia-400",
    ring: "ring-purple-400/60",
    text: "text-purple-300",
    glow: "glow-purple",
    pill: "bg-purple-400/10 border-purple-400/40 text-purple-300",
  },
  スーパー: {
    bg: "from-sky-300 to-cyan-400",
    ring: "ring-sky-400/60",
    text: "text-sky-300",
    glow: "glow-blue",
    pill: "bg-sky-400/10 border-sky-400/40 text-sky-300",
  },
  ノーマル: {
    bg: "from-slate-400 to-slate-300",
    ring: "ring-slate-400/40",
    text: "text-slate-300",
    glow: "",
    pill: "bg-slate-400/10 border-slate-400/30 text-slate-300",
  },
};

const INGREDIENT_OPTIONS = Object.keys(INGREDIENT_ENERGY) as IngredientName[];

function StarField() {
  const stars = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    size: seededValue(i, 11) * 2.5 + 0.5,
    top: seededValue(i, 23) * 100,
    left: seededValue(i, 37) * 100,
    delay: seededValue(i, 41) * 6,
    duration: seededValue(i, 53) * 4 + 2,
    hue: seededValue(i, 67) > 0.7 ? "255,200,255" : seededValue(i, 71) > 0.5 ? "200,180,255" : "255,255,255",
  }));
  return (
    <div className="stars-container">
      {stars.map((s) => (
        <div
          key={s.id}
          className="star"
          style={{
            width: s.size, height: s.size,
            top: `${s.top}%`, left: `${s.left}%`,
            background: `rgb(${s.hue})`,
            animation: `twinkle ${s.duration}s ${s.delay}s ease-in-out infinite`,
            opacity: 0.2,
          }}
        />
      ))}
    </div>
  );
}

function seededValue(index: number, salt: number): number {
  const value = Math.sin(index * 9283 + salt * 1999) * 10000;
  return value - Math.floor(value);
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
  const [showSharePreview, setShowSharePreview] = useState(false);
  const [ingredientSetKey, setIngredientSetKey] = useState("");
  const [customIngredientSlots, setCustomIngredientSlots] = useState<IngredientSlot[] | null>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
    setManualName("");
    setFeedback(null);
    setNeedsType(null);
    setIngredientSetKey("");
    setCustomIngredientSlots(null);
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
        const energyMaster = getPokemonEnergyData((manualName || data.pokemonName || "").trim());
        setIngredientSetKey(energyMaster ? getDefaultIngredientSet(energyMaster).key : "");
        setCustomIngredientSlots(null);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const gradeConfig = result ? GRADE_CONFIG[result.grade.label as keyof typeof GRADE_CONFIG] : null;
  const energyPokemonName = result ? (manualName || result.pokemonName || "").trim() : "";
  const energyData = energyPokemonName ? getPokemonEnergyData(energyPokemonName) : null;
  const activeIngredientSetKey = energyData
    ? ingredientSetKey || getDefaultIngredientSet(energyData).key
    : "";
  const activeIngredientSet = energyData
    ? customIngredientSlots
      ? {
          key: "custom",
          label: customIngredientSlots.map((slot) => `${shortIngredientLabel(slot.ingredient)}${slot.count}`).join(" / "),
          ingredients: customIngredientSlots.map((slot) => slot.ingredient),
          slots: customIngredientSlots as [IngredientSlot, IngredientSlot, IngredientSlot],
        }
      : getIngredientSet(energyData, activeIngredientSetKey)
    : null;
  const energyEstimate = result && energyData
    ? calculateEnergyEstimate({
        pokemonName: energyData.name,
        nature: result.nature,
        subskills: result.subskills,
        ingredientSetKey: activeIngredientSetKey,
        ingredientSet: activeIngredientSet ?? undefined,
      })
    : null;

  const shareUrl = (() => {
    if (!result) return "";
    const pId = encodePokemon(result.pokemonName || "");
    const pts = (result.subskillDetails ?? []).map(s => s.score).join(",");
    let base = `https://pokemon-sleep-checker.vercel.app/share?t=${encodeType(result.type)}&s=${result.scores.total}&g=${encodeGrade(result.grade.label)}&na=${encodeNature(result.nature)}&sk=${encodeSubskills(result.subskills)}&pts=${pts}&natpt=${result.scores.nature}`;
    if (pId) base += `&p=${pId}`;
    if (energyEstimate) base += `&en=${Math.round(energyEstimate.total)}`;
    return base;
  })();

  const shareText = result
    ? [
        "【ポケスリ個体値チェッカー】",
        `${manualName || result.pokemonName}（${result.type}タイプ）`,
        `スコア：${result.scores.total}点 ${result.grade.emoji}${result.grade.label}`,
        energyEstimate ? `24h期待エナジー：${formatEnergy(energyEstimate.total)}` : null,
      ].filter(Boolean).join("\n")
    : "";

  const handleManualNameChange = (value: string) => {
    setManualName(value);
    if (!result) return;
    const data = getPokemonEnergyData((value || result.pokemonName || "").trim());
    setIngredientSetKey(data ? getDefaultIngredientSet(data).key : "");
    setCustomIngredientSlots(null);
  };

  return (
    <main
      className="relative min-h-screen overflow-x-hidden"
      style={{ background: "linear-gradient(160deg, #08041a 0%, #100828 40%, #060d24 100%)" }}
    >
      <StarField />

      {/* シェアプレビューモーダル */}
      {showSharePreview && result && (
        <Suspense fallback={null}>
          <SharePreviewModal
            pokemonName={manualName || result.pokemonName || "ポケモン"}
            type={result.type}
            score={result.scores.total}
            grade={result.grade.label}
            gradeEmoji={result.grade.emoji}
            nature={result.nature}
            natureScore={result.scores.nature}
            subskills={result.subskillDetails ?? result.subskills.map(s => ({ name: s, score: 0 }))}
            energyTotal={energyEstimate?.total ?? null}
            shareUrl={shareUrl}
            shareText={shareText}
            onClose={() => setShowSharePreview(false)}
          />
        </Suspense>
      )}

      <div className="relative z-10 max-w-xl mx-auto px-4 py-10">

        {/* ヘッダー */}
        <div className="text-center mb-10 animate-fadeInUp">
          {/* ロゴカード */}
          <div className="inline-flex flex-col items-center gap-3 px-8 py-6 rounded-3xl mb-2"
            style={{
              background: "linear-gradient(160deg, rgba(232,121,249,0.1), rgba(129,140,248,0.08))",
              border: "1px solid rgba(232,121,249,0.2)",
              boxShadow: "0 0 40px rgba(168,85,247,0.12)",
            }}>
            <div className="text-5xl animate-float">🌙</div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                <span className="shimmer-text">ポケスリ個体値チェッカー</span>
              </h1>
              <p className="text-xs mt-1" style={{ color: "rgba(196,181,253,0.6)" }}>
                スクショを貼るだけで個体を自動採点
              </p>
            </div>
          </div>
        </div>

        {/* ヘルプバナー */}
        <Link
          href="/help"
          className="flex items-center justify-between glass-card-pink rounded-2xl px-5 py-4 mb-4 hover:opacity-80 transition-all duration-300 animate-fadeInUp group"
          style={{ animationDelay: "0.05s" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📱</span>
            <div>
              <p className="text-sm font-bold text-white">スクショの撮り方がわからない？</p>
              <p className="text-xs" style={{ color: "#7c6f9e" }}>どの画面を撮ればいいか解説しています</p>
            </div>
          </div>
          <span style={{ color: "#c4b5fd" }} className="text-lg group-hover:translate-x-1 transition-transform">→</span>
        </Link>

        {/* スクショアップロード */}
        <div className="glass-card rounded-2xl p-5 mb-4 animate-fadeInUp" style={{ animationDelay: "0.1s" }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#c4b5fd" }}>
            ✦ スクリーンショットをアップロード
          </p>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all duration-300"
            style={{ borderColor: "rgba(196,181,253,0.3)" }}
            onClick={() => document.getElementById("fileInput")?.click()}
          >
            {image ? (
              <Image src={image} alt="preview" width={400} height={300} className="mx-auto rounded-xl max-h-52 object-contain" />
            ) : (
              <div className="py-8">
                <div className="text-5xl mb-3">🌸</div>
                <p className="text-sm font-medium" style={{ color: "#ddd6fe" }}>ドロップ、またはタップして選択</p>
                <p className="text-xs mt-1" style={{ color: "rgba(196,181,253,0.5)" }}>性格・サブスキルが映っている画面</p>
              </div>
            )}
            <input id="fileInput" type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>
        </div>

        {/* ニックネーム */}
        <div className="glass-card rounded-2xl p-5 mb-4 animate-fadeInUp" style={{ animationDelay: "0.15s" }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#c4b5fd" }}>
            ✦ ポケモン名（任意）
            <span className="ml-2 normal-case font-normal" style={{ color: "rgba(148,163,184,0.6)" }}>ニックネームをつけている場合</span>
          </p>
          <input
            type="text"
            value={manualName}
            onChange={(e) => handleManualNameChange(e.target.value)}
            placeholder="例：サーナイト"
            className="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none transition"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(196,181,253,0.2)",
            }}
          />
        </div>

        {/* アフィリエイト */}
        <div className="flex justify-center mb-4 overflow-hidden rounded-xl">
          <AffiliateBanner id={1} />
        </div>

        {/* タイプ不明時のセレクター */}
        {needsType && (
          <div className="glass-card-pink rounded-2xl p-5 mb-4 animate-fadeInUp">
            <p className="text-xs font-bold mb-1" style={{ color: "#f9a8d4" }}>
              「{needsType.pokemonName || "このポケモン"}」の得意なものを選んでください
            </p>
            <p className="text-xs mb-3" style={{ color: "rgba(148,163,184,0.6)" }}>対応表に登録がないため手動選択が必要です</p>
            <div className="grid grid-cols-3 gap-3">
              {TYPE_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => handleAnalyze(t.value)}
                  className="py-4 rounded-xl font-bold transition-all duration-300"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(196,181,253,0.2)",
                    color: "#ddd6fe",
                  }}
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
          className="w-full font-black py-4 rounded-2xl text-lg transition-all duration-300 mb-6"
          style={file && !loading ? {
            background: "linear-gradient(135deg, #e879f9, #818cf8, #60a5fa)",
            color: "white",
            boxShadow: "0 0 32px rgba(232,121,249,0.4), 0 8px 24px rgba(0,0,0,0.3)",
            transform: "translateY(0)",
          } : {
            background: "rgba(255,255,255,0.04)",
            color: "rgba(148,163,184,0.4)",
            cursor: "not-allowed",
          }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">✦</span> AI解析中...
            </span>
          ) : !file ? "スクショをアップロードしてください" : "✨ 採点する"}
        </button>

        {/* エラー */}
        {error && (
          <div className="rounded-2xl p-4 mb-4 text-sm animate-fadeInUp whitespace-pre-line"
            style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", color: "#fda4af" }}>
            ⚠️ {error}
          </div>
        )}

        {/* 結果カード */}
        {result && gradeConfig && (
          <div className={`glass-card rounded-2xl p-6 mb-6 ring-1 ${gradeConfig.ring} ${gradeConfig.glow} animate-fadeInUp`}>
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

            <div className="space-y-4 mb-5">
              <ScoreBar label="性格" value={result.scores.nature} max={25} detail={result.nature} />
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-400 font-medium">サブスキル</span>
                  <span className="text-white font-bold">{result.scores.subskill}<span className="text-slate-500">/75</span></span>
                </div>
                <div className="bg-white/5 rounded-xl overflow-hidden divide-y divide-white/5">
                  {(result.subskillDetails ?? result.subskills.map(s => ({ name: s, score: 0 }))).map((s) => (
                    <div key={s.name} className="flex items-center justify-between px-3 py-2">
                      <span className="text-sm text-slate-200">{s.name}</span>
                      <span className="text-sm font-bold text-blue-300">+{s.score}pt</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {result.comment && (
              <p className="text-xs text-slate-400 text-center mb-4 leading-relaxed">💬 {result.comment}</p>
            )}

            <EnergyEstimatePanel
              data={energyData}
              estimate={energyEstimate}
              selectedSetKey={activeIngredientSetKey}
              activeIngredientSet={activeIngredientSet}
              isCustomIngredientSet={!!customIngredientSlots}
              ingredientOptions={INGREDIENT_OPTIONS}
              onSelectSet={(key) => {
                setIngredientSetKey(key);
                setCustomIngredientSlots(null);
              }}
              onCustomIngredientChange={(index, ingredient) => {
                if (!energyData || !activeIngredientSet) return;
                const slots = activeIngredientSet.slots ?? activeIngredientSet.ingredients.map((currentIngredient) => ({
                  ingredient: currentIngredient,
                  count: energyData.ingredientCount,
                }));
                const next = [...slots] as [IngredientSlot, IngredientSlot, IngredientSlot];
                next[index] = { ...next[index], ingredient };
                setCustomIngredientSlots(next);
              }}
              onUsePreset={() => setCustomIngredientSlots(null)}
            />

            {/* フィードバック */}
            <div className="rounded-2xl p-4 mb-4 text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
              {feedback ? (
                <p className="text-sm font-bold" style={{ color: "#86efac" }}>
                  {feedback === "good" ? "💗 フィードバックありがとうございます！" : "💬 ご意見ありがとうございます！"}
                </p>
              ) : (
                <>
                  <p className="text-xs mb-3" style={{ color: "rgba(148,163,184,0.6)" }}>この採点は正確でしたか？</p>
                  <div className="flex gap-3 justify-center">
                    <button onClick={() => sendFeedback("good")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs cursor-pointer" style={{ background: "rgba(134,239,172,0.1)", border: "1px solid rgba(134,239,172,0.3)", color: "#86efac" }}>👍 正確だった</button>
                    <button onClick={() => sendFeedback("bad")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs cursor-pointer" style={{ background: "rgba(251,113,133,0.1)", border: "1px solid rgba(251,113,133,0.3)", color: "#fda4af" }}>👎 おかしかった</button>
                  </div>
                </>
              )}
            </div>

            {/* シェアボタン */}
            <button
              onClick={() => setShowSharePreview(true)}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-base text-white cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #e879f9 0%, #a855f7 50%, #818cf8 100%)",
                border: "none",
                boxShadow: "0 0 32px rgba(232,121,249,0.35), 0 8px 24px rgba(0,0,0,0.3)",
                letterSpacing: 1,
              }}
            >
              ✦ シェアする
            </button>
          </div>
        )}

        {/* アフィリエイト（結果後） */}
        {result && (
          <div className="flex justify-center mb-4 overflow-hidden rounded-xl">
            <AffiliateBanner id={2} />
          </div>
        )}

        {/* 採点基準 */}
        <div className="glass-card rounded-2xl p-5 text-sm animate-fadeInUp" style={{ animationDelay: "0.3s" }}>
          <h2 className="font-bold mb-2 flex items-center gap-2" style={{ color: "#c4b5fd" }}>
            <span>📊</span> 採点基準について
          </h2>
          <p className="leading-relaxed text-xs" style={{ color: "rgba(148,163,184,0.7)" }}>
            各種攻略情報をもとに、性格（25点）・サブスキル（75点）の合計100点で評価。タイプに合った性格・サブスキルを持つほど高得点になります。
          </p>
        </div>

        <footer className="text-center text-xs mt-8 space-y-2" style={{ color: "rgba(100,116,139,0.6)" }}>
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            <Link href="/guide" className="hover:text-blue-300 transition-colors" style={{ color: "rgba(196,181,253,0.6)" }}>📊 攻略ガイド</Link>
            <Link href="/help" className="hover:text-blue-300 transition-colors" style={{ color: "rgba(196,181,253,0.6)" }}>📱 使い方</Link>
            <Link href="/about" className="hover:text-blue-300 transition-colors" style={{ color: "rgba(100,116,139,0.5)" }}>運営者情報</Link>
            <Link href="/contact" className="hover:text-blue-300 transition-colors" style={{ color: "rgba(100,116,139,0.5)" }}>お問い合わせ</Link>
            <Link href="/privacy" className="hover:text-blue-300 transition-colors" style={{ color: "rgba(100,116,139,0.5)" }}>プライバシーポリシー</Link>
          </nav>
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
      <a href="https://px.a8.net/svt/ejp?a8mat=4B1O1T+AHGV2Y+3QJC+669JL" rel="nofollow" target="_blank">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img style={{ border: 0 }} width={468} height={60} alt="" src="https://www25.a8.net/svt/bgt?aid=260418305634&wid=002&eno=01&mid=s00000017436001037000&mc=1" />
      </a>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img style={{ border: 0 }} width={1} height={1} src="https://www14.a8.net/0.gif?a8mat=4B1O1T+AHGV2Y+3QJC+669JL" alt="" />
    </div>
  );
}

function EnergyEstimatePanel({
  data,
  estimate,
  selectedSetKey,
  activeIngredientSet,
  isCustomIngredientSet,
  ingredientOptions,
  onSelectSet,
  onCustomIngredientChange,
  onUsePreset,
}: {
  data: PokemonEnergyData | null;
  estimate: EnergyBreakdown | null;
  selectedSetKey: string;
  activeIngredientSet: IngredientSet | null;
  isCustomIngredientSet: boolean;
  ingredientOptions: IngredientName[];
  onSelectSet: (key: string) => void;
  onCustomIngredientChange: (index: number, ingredient: IngredientName) => void;
  onUsePreset: () => void;
}) {
  if (!data || !estimate) {
    return (
      <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between gap-3 mb-2">
          <p className="text-xs font-black tracking-widest uppercase" style={{ color: "#fde68a" }}>
            ⚡ 24h期待エナジー
          </p>
          <span className="text-[10px] px-2 py-1 rounded-full" style={{ background: "rgba(251,191,36,0.08)", color: "rgba(253,230,138,0.8)" }}>
            準備中
          </span>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "rgba(148,163,184,0.72)" }}>
          このポケモンの期待値マスターデータは準備中です。個体値評価は通常どおり使えます。
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4 mb-4" style={{ background: "linear-gradient(160deg, rgba(251,191,36,0.09), rgba(56,189,248,0.07))", border: "1px solid rgba(251,191,36,0.18)" }}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-black tracking-widest uppercase" style={{ color: "#fde68a" }}>
            ⚡ 24h期待エナジー
          </p>
          <p className="text-[11px] mt-1" style={{ color: "rgba(148,163,184,0.68)" }}>
            睡眠8.5h + 日中15.5h想定のざっくり絶対値
          </p>
        </div>
        <select
          value={selectedSetKey}
          onChange={(e) => onSelectSet(e.target.value)}
          className="max-w-[46%] rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
          style={{ background: "rgba(15,23,42,0.85)", border: "1px solid rgba(251,191,36,0.28)" }}
          aria-label="食材候補セット"
        >
          {data.ingredientSets.map((set) => (
            <option key={set.key} value={set.key}>
              {set.label}
            </option>
          ))}
        </select>
      </div>

      {activeIngredientSet && (
        <div className="rounded-xl px-3 py-3 mb-4" style={{ background: "rgba(15,23,42,0.28)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-[10px] font-bold tracking-widest" style={{ color: "rgba(253,230,138,0.74)" }}>
              食材を個別に補正
            </p>
            {isCustomIngredientSet && (
              <button
                type="button"
                onClick={onUsePreset}
                className="text-[10px] px-2 py-1 rounded-lg"
                style={{ color: "rgba(203,213,225,0.78)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                候補セットに戻す
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {activeIngredientSet.ingredients.map((ingredient, index) => (
              <label key={`${index}-${ingredient}`} className="min-w-0">
                <span className="block text-[10px] mb-1" style={{ color: "rgba(148,163,184,0.68)" }}>
                  {index === 0 ? "Lv1" : index === 1 ? "Lv30" : "Lv60"}
                  {activeIngredientSet.slots?.[index] ? ` / ${activeIngredientSet.slots[index].count}個` : ""}
                </span>
                <select
                  value={ingredient}
                  onChange={(e) => onCustomIngredientChange(index, e.target.value as IngredientName)}
                  className="w-full rounded-lg px-2 py-2 text-[11px] font-bold text-white focus:outline-none"
                  style={{ background: "rgba(15,23,42,0.85)", border: "1px solid rgba(251,191,36,0.2)" }}
                  aria-label={`食材${index + 1}`}
                >
                  {ingredientOptions.map((option) => (
                    <option key={option} value={option}>
                      {shortIngredientLabel(option)}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <p className="text-[10px] mt-2 leading-relaxed" style={{ color: "rgba(148,163,184,0.56)" }}>
            実際の食材と違う場合は、各枠を選び直してください。選んだ食材で期待エナジーを再計算します。
          </p>
        </div>
      )}

      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <p className="text-[11px] mb-1" style={{ color: "rgba(203,213,225,0.72)" }}>合計</p>
          <p className="text-4xl font-black tabular-nums" style={{ color: "#fef3c7", textShadow: "0 0 18px rgba(251,191,36,0.28)" }}>
            {formatEnergy(estimate.total)}
          </p>
        </div>
        <p className="text-xs pb-1" style={{ color: "rgba(203,213,225,0.62)" }}>
          エナジー / 24h
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <EnergyChip label="きのみ" value={estimate.berry} color="#93c5fd" />
        <EnergyChip label="食材" value={estimate.ingredient} color="#86efac" />
        <EnergyChip label="スキル" value={estimate.skill} color="#f0abfc" />
      </div>

      <div className="space-y-2 rounded-xl px-3 py-3 mb-3" style={{ background: "rgba(15,23,42,0.32)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-[10px] font-bold tracking-widest" style={{ color: "rgba(253,230,138,0.74)" }}>
          内訳
        </p>
        <EnergyFormula
          label="きのみ"
          value={estimate.berry}
          formula={`${formatDecimal(estimate.details.berry.energyPerBerry)}エナジー × ${formatDecimal(estimate.details.berry.countPerHour)}個/h × 24h`}
          color="#93c5fd"
        />
        <EnergyFormula
          label="食材"
          value={estimate.ingredient}
          formula={`平均${formatDecimal(estimate.details.ingredient.averageEnergy)}エナジー × ${formatDecimal(estimate.details.ingredient.countPerHour)}個/h × 24h`}
          color="#86efac"
        />
        <EnergyFormula
          label="スキル"
          value={estimate.skill}
          formula={`${formatDecimal(estimate.details.skill.energyPerTrigger)}エナジー × ${formatDecimal(estimate.details.skill.triggerPerHour)}回/h × 24h`}
          color="#f0abfc"
        />
      </div>

      <div className="space-y-2 rounded-xl px-3 py-3" style={{ background: "rgba(15,23,42,0.32)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-[10px] leading-relaxed" style={{ color: "rgba(203,213,225,0.72)" }}>
          前提: Lv60 / 睡眠{estimate.assumptions.sleepHours}h + 日中{estimate.assumptions.awakeHours}h / 起床時げんき100 / メインスキルLv{estimate.assumptions.mainSkillLevel}
        </p>
        <p className="text-[10px] leading-relaxed" style={{ color: "rgba(148,163,184,0.58)" }}>
          未反映: 料理・レシピレベル・料理大成功・フィールド好みきのみ・チーム補正・最大所持数・所持数あふれ
        </p>
        <p className="text-[10px] leading-relaxed" style={{ color: "rgba(148,163,184,0.58)" }}>
          食材候補セットは手動選択。共有カードにも24h期待エナジーを表示します。
        </p>
      </div>
    </div>
  );
}

function EnergyChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl px-3 py-3 text-center" style={{ background: "rgba(15,23,42,0.42)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <p className="text-[11px] mb-1" style={{ color: "rgba(203,213,225,0.68)" }}>{label}</p>
      <p className="text-sm font-black tabular-nums" style={{ color }}>{formatEnergy(value)}</p>
    </div>
  );
}

function EnergyFormula({ label, value, formula, color }: { label: string; value: number; formula: string; color: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-[10px] leading-relaxed">
      <div className="min-w-0">
        <span className="font-bold" style={{ color }}>{label}</span>
        <span style={{ color: "rgba(203,213,225,0.72)" }}>：{formula}</span>
      </div>
      <span className="font-black tabular-nums shrink-0" style={{ color }}>
        = {formatEnergy(value)}
      </span>
    </div>
  );
}

function formatEnergy(value: number): string {
  return value.toLocaleString("ja-JP");
}

function formatDecimal(value: number): string {
  if (Math.abs(value) >= 100 || Number.isInteger(value)) return Math.round(value).toLocaleString("ja-JP");
  return value.toLocaleString("ja-JP", { maximumFractionDigits: 1 });
}

function shortIngredientLabel(ingredient: IngredientName): string {
  return ingredient
    .replace("とくせん", "")
    .replace("あったか", "")
    .replace("あんみん", "")
    .replace("リラックス", "")
    .replace("ワカクサ", "")
    .replace("ほっこり", "")
    .replace("ピュアな", "")
    .replace("ふといなが", "")
    .replace("めざまし", "")
    .replace("ずっしり", "")
    .replace("つやつや", "");
}

function ScoreBar({ label, value, max, detail }: {
  label: string; value: number; max: number; detail: string;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium" style={{ color: "rgba(196,181,253,0.7)" }}>{label}</span>
        <span className="font-bold text-white">{value}<span style={{ color: "rgba(148,163,184,0.5)" }}>/{max}</span></span>
      </div>
      <div className="rounded-full h-2 mb-1 overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #e879f9, #818cf8)",
          }}
        />
      </div>
      <p className="text-xs" style={{ color: "rgba(148,163,184,0.5)" }}>{detail}</p>
    </div>
  );
}
