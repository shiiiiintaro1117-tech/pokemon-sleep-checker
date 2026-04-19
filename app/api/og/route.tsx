import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const GRADE_COLORS: Record<string, string> = {
  マスター: "#fbbf24",
  ハイパー: "#a78bfa",
  スーパー: "#60a5fa",
  ノーマル: "#94a3b8",
};

const GRADE_EMOJIS: Record<string, string> = {
  マスター: "👑",
  ハイパー: "💎",
  スーパー: "⭐",
  ノーマル: "🔰",
};

async function loadFont(text: string): Promise<ArrayBuffer | null> {
  try {
    // IE UA → woff形式で返ってくる（Satoriはwoff2非対応）
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(text)}`,
      { headers: { "User-Agent": "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)" } }
    ).then((r) => r.text());

    const match = css.match(/url\((https?:\/\/[^)]+)\)/);
    if (!match) return null;
    const res = await fetch(match[1]);
    if (!res.ok) return null;
    return res.arrayBuffer();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") || "ポケモン";
  const type = searchParams.get("type") || "";
  const score = searchParams.get("score") || "0";
  const grade = searchParams.get("grade") || "ノーマル";
  const nature = searchParams.get("nature") || "";
  const subskills = (searchParams.get("subskills") || "").split(",").filter(Boolean);

  const gradeColor = GRADE_COLORS[grade] || "#94a3b8";
  const gradeEmoji = GRADE_EMOJIS[grade] || "🔰";

  const allText = `ポケスリ個体値チェッカー${name}${type}タイプ${grade}点性格${nature}${subskills.join("")}`;
  const fontData = await loadFont(allText);
  const fonts = fontData
    ? [{ name: "NotoSansJP", data: fontData, weight: 700 as const }]
    : [];

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "linear-gradient(135deg, #0a0f2e 0%, #0d1b4b 50%, #1a0a3e 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fontData ? "NotoSansJP" : "sans-serif",
          color: "white",
          position: "relative",
        }}
      >
        <div style={{ fontSize: 26, color: "#93c5fd", marginBottom: 24, letterSpacing: 2, display: "flex" }}>
          🌙 ポケスリ個体値チェッカー
        </div>

        <div style={{ fontSize: 34, fontWeight: 700, marginBottom: 20, color: "#e2e8f0", display: "flex" }}>
          {name}（{type}タイプ）
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 4 }}>
          <div style={{ fontSize: 120, fontWeight: 700, color: gradeColor, lineHeight: 1, display: "flex" }}>
            {score}
          </div>
          <div style={{ fontSize: 28, color: "#94a3b8", marginBottom: 16, display: "flex" }}>点</div>
        </div>

        <div style={{ fontSize: 44, fontWeight: 700, color: gradeColor, marginBottom: 36, display: "flex" }}>
          {gradeEmoji} {grade}
        </div>

        <div
          style={{
            display: "flex",
            gap: 40,
            background: "rgba(255,255,255,0.06)",
            borderRadius: 20,
            padding: "20px 40px",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 14, color: "#64748b", display: "flex" }}>性格</div>
            <div style={{ fontSize: 24, color: "#f1f5f9", display: "flex" }}>{nature}</div>
          </div>
          <div style={{ width: 1, background: "rgba(255,255,255,0.1)", alignSelf: "stretch", display: "flex" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 14, color: "#64748b", display: "flex" }}>サブスキル</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {subskills.slice(0, 3).map((s, i) => (
                <div key={i} style={{ fontSize: 20, color: "#f1f5f9", display: "flex" }}>✓ {s}</div>
              ))}
              {subskills.length > 3 && (
                <div style={{ fontSize: 16, color: "#64748b", display: "flex" }}>他{subskills.length - 3}個</div>
              )}
            </div>
          </div>
        </div>

        <div style={{ position: "absolute", bottom: 28, fontSize: 18, color: "#334155", display: "flex" }}>
          pokemon-sleep-checker.vercel.app
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts }
  );
}
