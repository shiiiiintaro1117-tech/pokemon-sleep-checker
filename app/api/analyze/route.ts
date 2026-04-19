import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SUBSKILL_SCORES: Record<string, Record<string, number>> = {
  きのみ: {
    // SS: 必須級
    "きのみの数S": 15,
    // S: 強力
    おてつだいボーナス: 13,
    "おてつだいスピードM": 13,
    // A: 実用的
    "おてつだいスピードS": 9,
    おてつだいサポートM: 8,
    げんきチャージS: 7,
    げんきチャージM: 6,
    睡眠EXPボーナス: 6,
    げんき回復ボーナス: 5,
    // B: 状況依存
    最大所持数アップ: 5,
    おてつだいサポートS: 5,
    "スキルレベルアップM": 4,
    "スキルレベルアップS": 3,
    "スキル確率アップM": 3,
    "スキル確率アップS": 3,
    // C: 相性悪い
    "食材確率アップM": 2,
    "食材確率アップS": 2,
  },
  食材: {
    // SS: 必須級
    "食材確率アップM": 15,
    // S: 強力
    "きのみの数S": 12,
    おてつだいボーナス: 12,
    "食材確率アップS": 11,
    // A: 実用的
    "おてつだいスピードM": 10,
    最大所持数アップ: 9,
    "おてつだいスピードS": 7,
    おてつだいサポートM: 7,
    げんきチャージS: 6,
    睡眠EXPボーナス: 5,
    げんき回復ボーナス: 5,
    おてつだいサポートS: 5,
    // B: 汎用
    "スキルレベルアップM": 4,
    "スキルレベルアップS": 3,
    "スキル確率アップM": 3,
    "スキル確率アップS": 3,
  },
  スキル: {
    // SS: 必須級（どちらか1つで合格ライン）
    "スキル確率アップM": 15,
    "スキルレベルアップM": 14,
    // S: 強力
    おてつだいボーナス: 12,
    "きのみの数S": 10,
    "スキル確率アップS": 10,
    "スキルレベルアップS": 9,
    // A: 実用的
    "おてつだいスピードM": 8,
    "おてつだいスピードS": 6,
    げんきチャージS: 6,
    睡眠EXPボーナス: 5,
    げんき回復ボーナス: 5,
    おてつだいサポートM: 5,
    おてつだいサポートS: 4,
    // B: 汎用
    最大所持数アップ: 4,
    "食材確率アップM": 3,
    "食材確率アップS": 3,
  },
};

const NATURE_SCORES: Record<string, Record<string, number>> = {
  きのみ: {
    // SS: おてつだいスピード↑かつ食材確率↓
    いじっぱり: 25, やんちゃ: 23,
    // S: おてつだいスピード↑
    ゆうかん: 20, さみしがり: 20,
    // A: 経験値↑（育成効率向上）
    ようき: 15, せっかち: 15, むじゃき: 15,
    // B: 無補正
    てれや: 8, がんばりや: 8, すなお: 8, きまぐれ: 8, まじめ: 8,
    // C以下: おてつだいスピード↓は不可
  },
  食材: {
    // SS: 食材確率↑
    れいせい: 25, うっかりや: 25,
    // S: 食材数増加に寄与
    ひかえめ: 18, おっとり: 18, ゆうかん: 18, やんちゃ: 18, さみしがり: 18,
    // A: 汎用的に悪くない
    せっかち: 12, むじゃき: 12,
    // B: 無補正
    てれや: 8, がんばりや: 8, すなお: 8, きまぐれ: 8, まじめ: 8,
  },
  スキル: {
    // SS: スキル発動率↑
    なまいき: 25, しんちょう: 25,
    // S: おてつだいスピード↑ or 経験値↑
    おとなしい: 20, いじっぱり: 20, ゆうかん: 20,
    // A: 汎用的に悪くない
    さみしがり: 15, ようき: 15, せっかち: 13,
    // B: 無補正
    てれや: 8, がんばりや: 8, すなお: 8, きまぐれ: 8, まじめ: 8,
  },
};

// サブスキルごとの正しい背景色（固定値）
const SUBSKILL_COLOR_MAP: Record<string, "金" | "青" | "白"> = {
  // 金スキル
  "きのみの数S": "金",
  おてつだいボーナス: "金",
  "スキルレベルアップM": "金",
  睡眠EXPボーナス: "金",
  げんき回復ボーナス: "金",
  ゆめのかけら: "金",
  // 青スキル
  "スキル確率アップM": "青",
  "食材確率アップM": "青",
  "おてつだいスピードM": "青",
  "スキルレベルアップS": "青",
  げんきチャージM: "青",
  おてつだいサポートM: "青",
  // 白スキル
  "スキル確率アップS": "白",
  "食材確率アップS": "白",
  "おてつだいスピードS": "白",
  げんきチャージS: "白",
  おてつだいサポートS: "白",
  "最大所持数アップ": "白",
  リサーチEXPボーナス: "白",
};

const SUBSKILLS_BY_COLOR: Record<"金" | "青" | "白", string[]> = {
  金: ["きのみの数S", "おてつだいボーナス", "スキルレベルアップM", "睡眠EXPボーナス", "げんき回復ボーナス", "ゆめのかけら"],
  青: ["スキル確率アップM", "食材確率アップM", "おてつだいスピードM", "スキルレベルアップS", "げんきチャージM", "おてつだいサポートM"],
  白: ["スキル確率アップS", "食材確率アップS", "おてつだいスピードS", "げんきチャージS", "おてつだいサポートS", "最大所持数アップ", "リサーチEXPボーナス"],
};

function validateSubskills(raw: { name: string; color: string }[]): {
  valid: { name: string; color: string }[];
  needsReread: { reportedName: string; color: "金" | "青" | "白" }[];
} {
  const valid: { name: string; color: string }[] = [];
  const needsReread: { reportedName: string; color: "金" | "青" | "白" }[] = [];

  for (const item of raw) {
    if (!item?.name) continue;
    const expectedColor = SUBSKILL_COLOR_MAP[item.name];
    const reportedColor = item.color as "金" | "青" | "白";

    if (!expectedColor || (reportedColor && reportedColor !== expectedColor)) {
      // 名前不明 or 色が一致しない → 再読み取り対象
      if (reportedColor && SUBSKILLS_BY_COLOR[reportedColor]) {
        needsReread.push({ reportedName: item.name, color: reportedColor });
      }
    } else {
      valid.push(item);
    }
  }
  return { valid, needsReread };
}

const IDEAL_NATURE: Record<string, { best: string[]; good: string[] }> = {
  きのみ: { best: ["いじっぱり", "やんちゃ"], good: ["ゆうかん", "さみしがり"] },
  食材: { best: ["れいせい", "うっかりや"], good: ["ひかえめ", "おっとり", "ゆうかん", "やんちゃ", "さみしがり"] },
  スキル: { best: ["なまいき", "しんちょう"], good: ["おとなしい", "いじっぱり", "ゆうかん"] },
};

const IDEAL_SUBSKILLS: Record<string, string[]> = {
  きのみ: ["きのみの数S", "おてつだいボーナス", "おてつだいスピードM", "おてつだいスピードS", "げんきチャージS"],
  食材: ["食材確率アップM", "きのみの数S", "おてつだいボーナス", "食材確率アップS", "最大所持数アップ"],
  スキル: ["スキル確率アップM", "スキルレベルアップM", "おてつだいボーナス", "スキル確率アップS", "スキルレベルアップS"],
};

function buildComment({ type, nature, subskills, finalScore }: {
  type: string; nature: string; subskills: string[];
  finalScore: number;
}): string {
  const ideal = IDEAL_NATURE[type] ?? { best: [], good: [] };
  const idealSubs = IDEAL_SUBSKILLS[type] ?? [];
  const isNatureBest = ideal.best.includes(nature);
  const isNatureGood = ideal.good.includes(nature);
  const missingIdealSubs = idealSubs.filter((s) => !subskills.includes(s)).slice(0, 2);
  const hasTopSub = subskills.includes(idealSubs[0]);

  const naturePart = isNatureBest
    ? `性格「${nature}」は${type}タイプに最適です。`
    : isNatureGood
    ? `性格「${nature}」は${type}タイプに合っています（最高は${ideal.best.join("・")}）。`
    : `性格「${nature}」は${type}タイプとの相性が惜しいです（理想は${ideal.best.join("・")}）。`;

  const subPart = hasTopSub
    ? `サブスキルに「${idealSubs[0]}」があり優秀です。`
    : `サブスキルに「${idealSubs[0]}」がないのが惜しいです。`;

  const missingSubs = missingIdealSubs.length > 0
    ? `「${missingIdealSubs.join("」「")}」があるとさらに評価が上がります。`
    : "サブスキル構成は申し分ありません。";

  const targetNature = ideal.best.join("・");
  const targetSubs = idealSubs.slice(0, 3).join("・");

  if (finalScore >= 80) return `${naturePart}${subPart}性格・サブスキルともに理想に近い最強個体です！`;
  if (finalScore >= 60) return `${naturePart}${subPart}${missingSubs}さらに厳選するなら性格「${targetNature}」＋「${targetSubs}」を目指しましょう。`;
  if (finalScore >= 40) return `${naturePart}${subPart}${missingSubs}理想個体は性格「${targetNature}」＋サブスキルに「${targetSubs}」の組み合わせです。`;
  return `${naturePart}${subPart}この${type}タイプの理想個体は、性格「${targetNature}」＋サブスキルに「${targetSubs}」を持つ個体です。厳選を続けましょう！`;
}

function getGrade(score: number) {
  if (score >= 80) return { label: "マスター", color: "text-yellow-500", emoji: "👑" };
  if (score >= 60) return { label: "ハイパー", color: "text-purple-500", emoji: "💎" };
  if (score >= 40) return { label: "スーパー", color: "text-blue-500", emoji: "⭐" };
  return { label: "ノーマル", color: "text-gray-500", emoji: "🔰" };
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("image") as File;
  const type = formData.get("type") as string;
  if (!file) return NextResponse.json({ error: "画像がありません" }, { status: 400 });
  if (!type) return NextResponse.json({ error: "タイプを選択してください" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const mediaType = file.type as "image/jpeg" | "image/png" | "image/webp";

  const prompt = `このポケモンスリープのスクリーンショットから以下の情報を正確に読み取り、必ずJSON形式のみで返してください。他のテキストは一切含めないでください。

{
  "pokemonName": "ポケモン名",
  "nature": "性格名",
  "subskills": [
    {"name": "サブスキル名", "color": "金 または 青 または 白"},
    {"name": "サブスキル名", "color": "金 または 青 または 白"}
  ]
}

※サブスキルの背景色を必ず読み取ること（金＝黄金色、青＝水色、白＝グレー白）
※取得済みのサブスキルのみ含める（未取得はスキップ）
※読み取れない項目はnullにする`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
          { type: "text", text: prompt },
        ],
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  let parsed;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch {
    return NextResponse.json({ error: "読み取りに失敗しました。別の画像をお試しください。" }, { status: 422 });
  }

  const { pokemonName, nature, subskills: rawSubskills } = parsed;

  const missing: string[] = [];
  if (!nature) missing.push("性格");
  if (!rawSubskills || rawSubskills.length === 0) missing.push("サブスキル");
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `画像から「${missing.join("・")}」が読み取れませんでした。\nサブスキルと性格が両方映っているポケモンの詳細画面のスクショをお使いください。` },
      { status: 422 }
    );
  }

  // 色と名前の整合性チェック
  const isStructured = rawSubskills.length > 0 && typeof rawSubskills[0] === "object";
  const { valid: validItems, needsReread } = isStructured
    ? validateSubskills(rawSubskills as { name: string; color: string }[])
    : { valid: (rawSubskills as string[]).map((n) => ({ name: n, color: "" })), needsReread: [] };

  // 再読み取りが必要なサブスキルがある場合
  let rereadNames: string[] = [];
  if (needsReread.length > 0) {
    const groups = needsReread.reduce<Record<string, string[]>>((acc, { color }) => {
      if (!acc[color]) acc[color] = SUBSKILLS_BY_COLOR[color] ?? [];
      return acc;
    }, {});

    const rereadPrompt = `このポケモンスリープのスクリーンショットのサブスキルを再確認してください。
以下の色の背景を持つサブスキルのみ読み取り、JSON配列で返してください。他のテキストは不要です。

${Object.entries(groups).map(([color, candidates]) =>
  `【${color}色の背景のサブスキル】\n候補: ${candidates.join("・")}`
).join("\n\n")}

["読み取ったサブスキル名", ...]`;

    const rereadMsg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 128,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
          { type: "text", text: rereadPrompt },
        ],
      }],
    });

    try {
      const rereadText = rereadMsg.content[0].type === "text" ? rereadMsg.content[0].text : "[]";
      const arrMatch = rereadText.match(/\[[\s\S]*\]/);
      rereadNames = JSON.parse(arrMatch ? arrMatch[0] : "[]");
    } catch { rereadNames = []; }
  }

  // 有効なサブスキル名を確定
  const subskills: string[] = [
    ...validItems.map((v) => v.name),
    ...rereadNames.filter((n) => SUBSKILL_COLOR_MAP[n]),
  ];

  const subskillMap = SUBSKILL_SCORES[type] ?? {};
  const natureMap = NATURE_SCORES[type] ?? {};

  const natureScore = natureMap[nature] ?? 0;
  const subskillScore = subskills.reduce((sum, s) => sum + (subskillMap[s] ?? 2), 0);
  const cappedSubskill = Math.min(subskillScore, 75);
  const finalScore = Math.min(natureScore + cappedSubskill, 100);

  const grade = getGrade(finalScore);
  const comment = buildComment({ type, nature, subskills, finalScore });

  return NextResponse.json({
    pokemonName, type, nature, subskills,
    reread: rereadNames.length > 0,
    scores: { nature: natureScore, subskill: cappedSubskill, total: finalScore },
    grade, comment,
  });
}
