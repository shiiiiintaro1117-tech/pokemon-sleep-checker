import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { lookupType } from "@/lib/pokemonTypeMap";

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
  const manualType = (formData.get("type") as string) || null;
  if (!file) return NextResponse.json({ error: "画像がありません" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const mediaType = file.type as "image/jpeg" | "image/png" | "image/webp";

  const prompt = `このポケモンスリープのスクリーンショットから情報を読み取り、必ずJSON形式のみで返してください。説明文は不要です。

{
  "pokemonName": "ポケモン名",
  "nature": "性格名",
  "subskills": [
    {"slot": "Lv10",  "name": "サブスキル名", "color": "金または青または白"},
    {"slot": "Lv25",  "name": "サブスキル名", "color": "金または青または白"},
    {"slot": "Lv50",  "name": "サブスキル名", "color": "金または青または白"},
    {"slot": "Lv75",  "name": "サブスキル名", "color": "金または青または白"},
    {"slot": "Lv100", "name": "サブスキル名", "color": "金または青または白"}
  ]
}

【重要】
- サブスキルはLv10・Lv25・Lv50・Lv75・Lv100の5スロット必ず全て読み取ること
- 鍵マーク付き（未解放）でも名前が見えていれば読み取る
- 背景色：金＝黄金色、青＝水色、白＝グレー/白
- スロットが見当たらない場合のみnameをnullにする`;

  async function callOCR() {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
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
    const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : raw);
  }

  let parsed;
  try {
    parsed = await callOCR();
    // サブスキルが空だった場合は1回リトライ
    if (!parsed?.subskills || parsed.subskills.length === 0) {
      parsed = await callOCR();
    }
  } catch {
    return NextResponse.json({ error: "読み取りに失敗しました。別の画像をお試しください。" }, { status: 422 });
  }

  const { pokemonName, nature, subskills: rawSubskillsFull } = parsed;

  // slotフィールド付きの場合はnameがnullのスロットを除外して正規化
  const rawSubskills = (rawSubskillsFull ?? [])
    .map((s: { name?: string; color?: string }) => ({ name: s.name ?? null, color: s.color ?? "" }))
    .filter((s: { name: string | null }) => s.name);

  // タイプをOCR名→対応表で自動決定。手動指定があればそちらを優先
  const type = manualType ?? lookupType(pokemonName) ?? null;
  if (!type) {
    return NextResponse.json(
      { error: "needsType", pokemonName, nature, subskills: rawSubskills },
      { status: 200 }
    );
  }

  const missing: string[] = [];
  if (!nature) missing.push("性格");
  if (!rawSubskills || rawSubskills.length === 0) missing.push("サブスキル");
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `画像から「${missing.join("・")}」が読み取れませんでした。\nサブスキルと性格が両方映っているポケモンの詳細画面のスクショをお使いください。` },
      { status: 422 }
    );
  }

  // 既知のサブスキル名に一致するものだけ採用（重複除去・最大5個）
  const allKnownSubskills = new Set(Object.keys(SUBSKILL_COLOR_MAP));
  const subskills: string[] = [
    ...new Set(
      (rawSubskills as { name: string }[])
        .map((s) => s.name)
        .filter((n) => allKnownSubskills.has(n))
    ),
  ].slice(0, 5);

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
    reread: false,
    scores: { nature: natureScore, subskill: cappedSubskill, total: finalScore },
    grade, comment,
  });
}
