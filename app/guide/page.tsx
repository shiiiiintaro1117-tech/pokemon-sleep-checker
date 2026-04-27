import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ポケスリ個体値・採点基準の完全ガイド｜性格・サブスキル厳選",
  description: "ポケモンスリープの個体値採点の仕組みを徹底解説。きのみ・食材・スキルタイプ別のおすすめ性格・サブスキルランキングと厳選の考え方を紹介します。",
};

const NATURE_DATA = {
  きのみ: {
    s: ["ずぶとい（きのみ量↑）", "のんき（きのみ量↑）", "わんぱく（きのみ量↑）"],
    a: ["おだやか", "しんちょう", "なまいき"],
    c: ["ひかえめ", "おとなしい", "れいせい"],
    d: ["いじっぱり（食材↑効果なし）", "やんちゃ", "ようき"],
  },
  食材: {
    s: ["ひかえめ（食材頻度↑）", "おとなしい（食材頻度↑）", "れいせい（食材頻度↑）"],
    a: ["なまいき", "おだやか", "しんちょう"],
    c: ["ずぶとい", "のんき", "わんぱく"],
    d: ["いじっぱり", "ようき", "やんちゃ"],
  },
  スキル: {
    s: ["いじっぱり（スキル発動↑）", "ようき（スキル発動↑）", "やんちゃ（スキル発動↑）"],
    a: ["わんぱく", "むじゃき", "さみしがり"],
    c: ["ずぶとい", "ひかえめ", "おだやか"],
    d: ["なまいき", "れいせい", "おとなしい"],
  },
};

const SUBSKILL_DATA = [
  { rank: "S", score: 15, skills: ["きのみ獲得量S", "食材獲得数S", "スキル発動確率S", "おてつだいスピードS", "おてつだいボーナス"] },
  { rank: "A", score: 12, skills: ["きのみ獲得量M", "食材獲得数M", "スキル発動確率M", "おてつだいスピードM", "げんきチャージS"] },
  { rank: "B", score: 8, skills: ["きのみ獲得量L（一部）", "スキルレベルアップS", "おてつだいスピードS（条件付き）"] },
  { rank: "C", score: 4, skills: ["げんきチャージM", "スキルレベルアップM", "経験値ボーナス"] },
  { rank: "D", score: 2, skills: ["ゆめのかけらボーナス", "研究EXPボーナス"] },
];

export default function GuidePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-950 via-blue-950 to-slate-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mb-8">
          ← トップに戻る
        </Link>

        <h1 className="text-2xl font-black mb-2">📊 個体値・採点基準の完全ガイド</h1>
        <p className="text-slate-400 text-sm mb-8">性格・サブスキルの評価基準と厳選の考え方を解説</p>

        {/* 採点の仕組み */}
        <section className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-6">
          <h2 className="font-bold text-blue-300 mb-4 text-lg">🎯 採点の仕組み（100点満点）</h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            ポケスリ個体値チェッカーでは、ポケモンの強さを以下の2項目で評価します。
          </p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-slate-900 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-blue-400">25点</div>
              <div className="text-sm text-slate-300 mt-1">性格</div>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-purple-400">75点</div>
              <div className="text-sm text-slate-300 mt-1">サブスキル</div>
            </div>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            ※食材はポケモンごとに固定のため採点対象外です。タイプ（きのみ・食材・スキル）によって
            それぞれ最適な性格・サブスキルが異なります。
          </p>
        </section>

        {/* グレード表 */}
        <section className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-6">
          <h2 className="font-bold text-blue-300 mb-4 text-lg">🏆 グレード基準</h2>
          <div className="space-y-3">
            {[
              { emoji: "👑", label: "マスター", range: "80〜100点", color: "text-yellow-400", bg: "bg-yellow-900/30 border-yellow-700/50", desc: "厳選完了レベル。即戦力として運用できます。" },
              { emoji: "💎", label: "ハイパー", range: "60〜79点", color: "text-purple-400", bg: "bg-purple-900/30 border-purple-700/50", desc: "十分強い個体。余裕があればさらに厳選しても。" },
              { emoji: "⭐", label: "スーパー", range: "40〜59点", color: "text-blue-400", bg: "bg-blue-900/30 border-blue-700/50", desc: "平均的な強さ。中盤まで活躍できます。" },
              { emoji: "🔰", label: "ノーマル", range: "0〜39点", color: "text-slate-400", bg: "bg-slate-900/50 border-slate-700", desc: "厳選の余地あり。長期的には再厳選を推奨。" },
            ].map((g) => (
              <div key={g.label} className={`rounded-xl p-4 border ${g.bg}`}>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xl">{g.emoji}</span>
                  <span className={`font-bold ${g.color}`}>{g.label}</span>
                  <span className="text-slate-400 text-sm ml-auto">{g.range}</span>
                </div>
                <p className="text-slate-300 text-sm">{g.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* タイプ別おすすめ性格 */}
        <section className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-6">
          <h2 className="font-bold text-blue-300 mb-4 text-lg">🍃 タイプ別おすすめ性格</h2>
          <div className="space-y-4">
            {(Object.entries(NATURE_DATA) as [keyof typeof NATURE_DATA, typeof NATURE_DATA["きのみ"]][]).map(([type, ranks]) => (
              <div key={type} className="bg-slate-900 rounded-xl p-4">
                <h3 className="font-bold text-white mb-3">
                  {type === "きのみ" ? "🍓" : type === "食材" ? "🥕" : "✨"} {type}タイプ
                </h3>
                <div className="space-y-2 text-sm">
                  {[
                    { rank: "S（25点）", skills: ranks.s, color: "text-yellow-400" },
                    { rank: "A（20点）", skills: ranks.a, color: "text-purple-400" },
                    { rank: "B（10点）", skills: ranks.c, color: "text-blue-400" },
                    { rank: "D（0点）", skills: ranks.d, color: "text-red-400" },
                  ].map((row) => (
                    <div key={row.rank} className="flex gap-3">
                      <span className={`${row.color} font-bold w-20 shrink-0`}>{row.rank}</span>
                      <span className="text-slate-300">{row.skills.join("、")}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* サブスキルランキング */}
        <section className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-6">
          <h2 className="font-bold text-blue-300 mb-4 text-lg">⚡ サブスキル評価ランキング</h2>
          <p className="text-sm text-slate-400 mb-4 leading-relaxed">
            サブスキルはLv10・25・50・75・100で1つずつ解放されます（最大5個）。
            上位のサブスキルを持つほど高得点になります。
          </p>
          <div className="space-y-3">
            {SUBSKILL_DATA.map((row) => (
              <div key={row.rank} className="bg-slate-900 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`font-black text-lg ${
                    row.rank === "S" ? "text-yellow-400" :
                    row.rank === "A" ? "text-purple-400" :
                    row.rank === "B" ? "text-blue-400" :
                    row.rank === "C" ? "text-green-400" : "text-slate-400"
                  }`}>ランク {row.rank}</span>
                  <span className="text-slate-400 text-sm">1個あたり +{row.score}点</span>
                </div>
                <p className="text-sm text-slate-300">{row.skills.join("・")}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-3 leading-relaxed">
            ※スキルタイプはスキル発動確率S/Mが高評価。きのみタイプはきのみ獲得量S/Mを最重視します。
          </p>
        </section>

        {/* 厳選の考え方 */}
        <section className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-6">
          <h2 className="font-bold text-blue-300 mb-4 text-lg">💡 効率的な厳選の考え方</h2>
          <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
            <div>
              <h3 className="font-bold text-white mb-1">① まず性格を確認する</h3>
              <p>性格はLv1から確認できます。タイプに合った性格（S評価）であれば厳選候補として育成を進めましょう。性格がD評価なら再厳選を検討してください。</p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-1">② Lv10まで育ててサブスキルを確認</h3>
              <p>最初のサブスキルはLv10で解放されます。S/Aランクのサブスキルが出たら育成継続のサインです。C/D評価しか出なかった場合は再厳選を検討しましょう。</p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-1">③ 80点（マスター）を目標に</h3>
              <p>完璧な個体（100点）を狙いすぎると時間がかかります。性格S＋サブスキル2〜3個がS/Aランクであれば80点以上になることが多く、実用上は十分です。</p>
            </div>
          </div>
        </section>

        <div className="text-center mb-10">
          <Link
            href="/"
            className="inline-block bg-blue-500 hover:bg-blue-400 transition text-white font-bold px-8 py-4 rounded-xl text-lg"
          >
            ✨ さっそく採点してみる
          </Link>
        </div>

        <footer className="text-center text-slate-500 text-xs mt-4 space-y-2">
          <nav className="flex flex-wrap justify-center gap-4 text-slate-400">
            <Link href="/" className="hover:text-blue-300">トップ</Link>
            <Link href="/help" className="hover:text-blue-300">使い方</Link>
            <Link href="/about" className="hover:text-blue-300">運営者情報</Link>
            <Link href="/contact" className="hover:text-blue-300">お問い合わせ</Link>
            <Link href="/privacy" className="hover:text-blue-300">プライバシーポリシー</Link>
          </nav>
          <p>© 2025 ポケスリ個体値チェッカー</p>
        </footer>
      </div>
    </main>
  );
}
