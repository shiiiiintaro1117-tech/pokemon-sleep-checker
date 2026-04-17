"use client";

import { useState, useCallback } from "react";
import Image from "next/image";

type PokemonType = "きのみ" | "食材" | "スキル";

type Result = {
  pokemonName: string;
  type: string;
  nature: string;
  subskills: string[];
  ingredients: string[];
  scores: { nature: number; subskill: number; ingredient: number; total: number };
  grade: { label: string; color: string; emoji: string };
  comment: string;
};

const TYPE_OPTIONS: { value: PokemonType; emoji: string; label: string }[] = [
  { value: "きのみ", emoji: "🍓", label: "きのみ" },
  { value: "食材", emoji: "🥕", label: "食材" },
  { value: "スキル", emoji: "✨", label: "スキル" },
];

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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

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

  const canAnalyze = file && selectedType;

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-950 via-blue-950 to-slate-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">🌙 ポケスリ個体値チェッカー</h1>
          <p className="text-blue-300 text-sm">得意なものを選んでスクショを貼るだけで自動採点！</p>
        </div>

        {/* ステップ1：タイプ選択 */}
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 mb-4">
          <p className="text-sm text-slate-400 mb-3">
            <span className="text-white font-bold">① 得意なものを選択</span>
            <span className="ml-2 text-xs">（ポケモンの詳細画面で確認できます）</span>
          </p>
          <div className="grid grid-cols-3 gap-3">
            {TYPE_OPTIONS.map((t) => (
              <button
                key={t.value}
                onClick={() => { setSelectedType(t.value); setResult(null); }}
                className={`py-3 rounded-xl font-bold text-lg transition border-2 ${
                  selectedType === t.value
                    ? "border-blue-400 bg-blue-900 text-white"
                    : "border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-400"
                }`}
              >
                <div>{t.emoji}</div>
                <div className="text-sm mt-1">{t.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ステップ2：スクショアップロード */}
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 mb-4">
          <p className="text-sm text-slate-400 mb-3">
            <span className="text-white font-bold">② スクリーンショットをアップロード</span>
            <span className="ml-2 text-xs">（性格・サブスキルが映るページ）</span>
          </p>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-blue-400 rounded-xl p-4 text-center cursor-pointer hover:border-blue-300 transition"
            onClick={() => document.getElementById("fileInput")?.click()}
          >
            {image ? (
              <Image src={image} alt="preview" width={400} height={300} className="mx-auto rounded-xl max-h-56 object-contain" />
            ) : (
              <div className="py-6">
                <div className="text-4xl mb-2">📱</div>
                <p className="text-blue-200 text-sm font-medium">ここにドロップ、またはタップして選択</p>
              </div>
            )}
            <input
              id="fileInput"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        </div>

        {/* 広告スペース（AdSense設置予定） */}
        <div className="bg-slate-800 rounded-xl p-3 text-center text-slate-500 text-xs mb-4 border border-slate-700">
          広告スペース
        </div>

        {/* 採点ボタン */}
        <button
          onClick={handleAnalyze}
          disabled={!canAnalyze || loading}
          className="w-full bg-blue-500 hover:bg-blue-400 disabled:bg-slate-600 disabled:text-slate-400 text-white font-bold py-4 rounded-xl text-lg transition mb-6"
        >
          {loading ? "🔍 解析中..." : !selectedType ? "得意なものを選んでください" : !file ? "スクショをアップロードしてください" : "✨ 採点する"}
        </button>

        {error && (
          <div className="bg-red-900 border border-red-500 rounded-xl p-4 text-red-200 mb-4 whitespace-pre-line">
            ⚠️ {error}
          </div>
        )}

        {/* 結果表示 */}
        {result && (
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="text-center mb-6">
              <p className="text-slate-400 text-sm mb-1">
                {result.pokemonName}（{result.type}タイプ）
              </p>
              <div className={`text-5xl font-black mb-1 ${result.grade.color}`}>
                {result.scores.total}点
              </div>
              <div className={`text-2xl font-bold ${result.grade.color}`}>
                {result.grade.emoji} {result.grade.label}
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <ScoreBar label="性格" value={result.scores.nature} max={20} detail={result.nature} />
              <ScoreBar label="サブスキル" value={result.scores.subskill} max={60} detail={result.subskills.join("・")} />
              <ScoreBar label="食材" value={result.scores.ingredient} max={20} detail={result.ingredients.join("・") || "未取得"} />
            </div>

            {result.comment && (
              <div className="bg-blue-950 border border-blue-700 rounded-xl p-4 text-sm text-blue-100 mb-4 leading-relaxed">
                💬 {result.comment}
              </div>
            )}

            <div className="bg-slate-900 rounded-xl p-4 text-sm text-slate-300">
              <GradeGuide current={result.grade.label} />
            </div>
          </div>
        )}

        <div className="mt-8 bg-slate-800 rounded-2xl p-5 border border-slate-700 text-sm">
          <h2 className="font-bold text-blue-300 mb-3">📊 採点基準について</h2>
          <p className="text-slate-300 leading-relaxed">
            各種攻略情報をもとに、性格（20点）・サブスキル（60点）・食材（20点）の合計100点で評価します。
            タイプ（きのみ/食材/スキル）に合った性格・サブスキルを持つほど高得点になります。
          </p>
        </div>

        <footer className="text-center text-slate-500 text-xs mt-8">
          <p>© 2025 ポケスリ個体値チェッカー</p>
          <p className="mt-1">※本サイトは非公式ファンサイトです</p>
        </footer>
      </div>
    </main>
  );
}

function ScoreBar({ label, value, max, detail }: { label: string; value: number; max: number; detail: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-300">{label}</span>
        <span className="text-white font-bold">{value}/{max}点</span>
      </div>
      <div className="bg-slate-700 rounded-full h-3 mb-1">
        <div className="bg-blue-500 h-3 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-slate-400 text-xs">{detail}</p>
    </div>
  );
}

function GradeGuide({ current }: { current: string }) {
  const grades = [
    { label: "マスター", range: "80〜100点", emoji: "👑", color: "text-yellow-500" },
    { label: "ハイパー", range: "60〜79点", emoji: "💎", color: "text-purple-400" },
    { label: "スーパー", range: "40〜59点", emoji: "⭐", color: "text-blue-400" },
    { label: "ノーマル", range: "0〜39点", emoji: "🔰", color: "text-slate-400" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {grades.map((g) => (
        <div key={g.label} className={`flex items-center gap-2 ${current === g.label ? "opacity-100" : "opacity-40"}`}>
          <span>{g.emoji}</span>
          <span className={g.color + " font-bold"}>{g.label}</span>
          <span className="text-slate-400 text-xs">{g.range}</span>
        </div>
      ))}
    </div>
  );
}
