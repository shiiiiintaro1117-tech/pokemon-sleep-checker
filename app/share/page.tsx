import { Metadata } from "next";
import Link from "next/link";

type Props = {
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

const GRADE_COLORS: Record<string, { text: string; glow: string; ring: string; bg: string }> = {
  マスター: { text: "#fbbf24", glow: "0 0 40px rgba(251,191,36,0.4)", ring: "rgba(251,191,36,0.5)", bg: "rgba(251,191,36,0.1)" },
  ハイパー: { text: "#a78bfa", glow: "0 0 40px rgba(167,139,250,0.4)", ring: "rgba(167,139,250,0.5)", bg: "rgba(167,139,250,0.1)" },
  スーパー: { text: "#60a5fa", glow: "0 0 40px rgba(96,165,250,0.4)", ring: "rgba(96,165,250,0.5)", bg: "rgba(96,165,250,0.1)" },
  ノーマル: { text: "#94a3b8", glow: "none", ring: "rgba(148,163,184,0.3)", bg: "rgba(148,163,184,0.05)" },
};

const GRADE_EMOJIS: Record<string, string> = {
  マスター: "👑", ハイパー: "💎", スーパー: "⭐", ノーマル: "🔰",
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const name = params.n || params.name || "ポケモン";
  const type = params.t || params.type || "";
  const score = params.s || params.score || "0";
  const grade = params.g || params.grade || "ノーマル";
  const nature = params.na || params.nature || "";
  const subskills = params.sk || params.subskills || "";

  const ogUrl = `https://pokemon-sleep-checker.vercel.app/api/og?n=${encodeURIComponent(name)}&t=${encodeURIComponent(type)}&s=${encodeURIComponent(score)}&g=${encodeURIComponent(grade)}&na=${encodeURIComponent(nature)}&sk=${encodeURIComponent(subskills)}`;

  const title = `${name}（${type}タイプ）${score}点 ${grade} | ポケスリ個体値チェッカー`;
  const description = `${name}の個体値採点結果：${score}点（${grade}）。性格：${nature}。ポケスリ個体値チェッカーで採点してみよう！`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}

export default async function SharePage({ searchParams }: Props) {
  const params = await searchParams;
  const name = params.n || params.name || "ポケモン";
  const type = params.t || params.type || "";
  const score = params.s || params.score || "0";
  const grade = params.g || params.grade || "ノーマル";
  const nature = params.na || params.nature || "";
  const subskills = (params.sk || params.subskills || "").split(",").filter(Boolean);

  const gradeEmoji = GRADE_EMOJIS[grade] || "🔰";
  const colors = GRADE_COLORS[grade] || GRADE_COLORS["ノーマル"];

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        background: "linear-gradient(160deg, #0a0f2e 0%, #0d1b4b 40%, #1a0a3e 100%)",
        fontFamily: "sans-serif",
      }}
    >
      {/* カード */}
      <div style={{
        width: "100%",
        maxWidth: 440,
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${colors.ring}`,
        borderRadius: 24,
        padding: "36px 28px",
        boxShadow: colors.glow,
        textAlign: "center",
        color: "white",
      }}>
        {/* ヘッダー */}
        <p style={{ fontSize: 13, color: "#93c5fd", letterSpacing: 2, marginBottom: 20 }}>
          🌙 ポケスリ個体値チェッカー
        </p>

        {/* ポケモン名 */}
        <p style={{ fontSize: 20, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>
          {name}
        </p>
        <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>{type}タイプ</p>

        {/* スコア */}
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 88, fontWeight: 900, color: colors.text, lineHeight: 1 }}>
            {score}
          </span>
          <span style={{ fontSize: 24, color: "#94a3b8", marginLeft: 4 }}>点</span>
        </div>

        {/* グレード */}
        <div style={{
          display: "inline-block",
          background: colors.bg,
          border: `1px solid ${colors.ring}`,
          borderRadius: 40,
          padding: "8px 28px",
          fontSize: 22,
          fontWeight: 700,
          color: colors.text,
          marginBottom: 28,
        }}>
          {gradeEmoji} {grade}
        </div>

        {/* 性格・サブスキル */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          overflow: "hidden",
          marginBottom: 28,
          textAlign: "left",
        }}>
          <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 2 }}>性格</span>
            <span style={{ fontSize: 16, color: "#f1f5f9", fontWeight: 600 }}>{nature || "—"}</span>
          </div>
          <div style={{ padding: "12px 18px" }}>
            <span style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 6 }}>サブスキル</span>
            {subskills.length > 0 ? subskills.map((s, i) => (
              <div key={i} style={{ fontSize: 14, color: "#cbd5e1", padding: "3px 0" }}>
                ✓ {s}
              </div>
            )) : <span style={{ fontSize: 14, color: "#475569" }}>—</span>}
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/"
          style={{
            display: "block",
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            color: "white",
            fontWeight: 700,
            fontSize: 16,
            padding: "14px 24px",
            borderRadius: 14,
            textDecoration: "none",
          }}
        >
          ✨ 自分のポケモンも採点する
        </Link>

        <p style={{ fontSize: 12, color: "#334155", marginTop: 16 }}>
          pokemon-sleep-checker.vercel.app
        </p>
      </div>
    </main>
  );
}
