import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SUBSKILL_SCORES: Record<string, Record<string, number>> = {
  きのみ: {
    "きのみの数S": 12,
    "おてつだいスピードM": 10,
    おてつだいボーナス: 10,
    "きのみの数M": 7,
    "おてつだいスピードS": 7,
    最大所持数アップ: 4,
    "スキル確率アップS": 3,
    "スキル確率アップM": 3,
    "食材確率アップS": 2,
    "食材確率アップM": 2,
    げんきチャージS: 3,
    げんきチャージM: 2,
    おてつだいサポートS: 4,
    おてつだいサポートM: 6,
  },
  食材: {
    "食材確率アップM": 12,
    "食材確率アップS": 10,
    おてつだいボーナス: 10,
    最大所持数アップ: 8,
    "おてつだいスピードM": 7,
    "おてつだいスピードS": 5,
    "きのみの数S": 3,
    "きのみの数M": 2,
    "スキル確率アップS": 3,
    "スキル確率アップM": 3,
    げんきチャージS: 3,
    げんきチャージM: 2,
    おてつだいサポートS: 4,
    おてつだいサポートM: 6,
  },
  スキル: {
    "スキル確率アップM": 12,
    "スキル確率アップS": 10,
    おてつだいボーナス: 10,
    "おてつだいスピードM": 7,
    "おてつだいスピードS": 5,
    "きのみの数S": 3,
    "きのみの数M": 2,
    "食材確率アップS": 3,
    "食材確率アップM": 3,
    最大所持数アップ: 4,
    げんきチャージS: 3,
    げんきチャージM: 2,
    おてつだいサポートS: 4,
    おてつだいサポートM: 6,
  },
};

const NATURE_SCORES: Record<string, Record<string, number>> = {
  きのみ: {
    いじっぱり: 20,
    ゆうかん: 16,
    さみしがり: 16,
    やんちゃ: 16,
    ようき: 12,
    せっかち: 12,
    むじゃき: 12,
    てれや: 8,
    がんばりや: 8,
    すなお: 8,
    きまぐれ: 8,
    まじめ: 8,
  },
  食材: {
    れいせい: 20,
    うっかりや: 20,
    おっとり: 16,
    ゆうかん: 16,
    やんちゃ: 16,
    さみしがり: 16,
    せっかち: 12,
    むじゃき: 12,
    てれや: 8,
    がんばりや: 8,
    すなお: 8,
    きまぐれ: 8,
    まじめ: 8,
  },
  スキル: {
    なまいき: 20,
    しんちょう: 20,
    おとなしい: 16,
    いじっぱり: 16,
    ゆうかん: 16,
    さみしがり: 12,
    ようき: 12,
    てれや: 8,
    がんばりや: 8,
    すなお: 8,
    きまぐれ: 8,
    まじめ: 8,
  },
};

const INGREDIENT_SCORES: Record<string, number> = {
  ふといながねぎ: 20,
  あじわいキノコ: 20,
  げきからハーブ: 18,
  リラックスカカオ: 18,
  あまいミツ: 15,
  やわらかいもの: 15,
  もりのきのこ: 12,
  ほっこりポテト: 12,
  あんみんトマト: 12,
  ピュアなオイル: 10,
  あったかジンジャー: 10,
  マメミート: 10,
  おいしいしっぽ: 8,
  ワリバシ: 6,
  もとよりのエキス: 6,
};

const IDEAL_NATURE: Record<string, { best: string[]; good: string[] }> = {
  きのみ: { best: ["いじっぱり"], good: ["ゆうかん", "さみしがり", "やんちゃ"] },
  食材: { best: ["れいせい", "うっかりや"], good: ["おっとり", "ゆうかん", "やんちゃ", "さみしがり"] },
  スキル: { best: ["なまいき", "しんちょう"], good: ["おとなしい", "いじっぱり", "ゆうかん"] },
};

const IDEAL_SUBSKILLS: Record<string, string[]> = {
  きのみ: ["きのみの数S", "おてつだいボーナス", "おてつだいスピードM", "きのみの数M", "おてつだいスピードS"],
  食材: ["食材確率アップM", "おてつだいボーナス", "食材確率アップS", "最大所持数アップ", "おてつだいスピードM"],
  スキル: ["スキル確率アップM", "おてつだいボーナス", "スキル確率アップS", "おてつだいスピードM", "おてつだいスピードS"],
};

function buildComment({ type, nature, natureScore, subskills, cappedSubskill, finalScore }: {
  type: string; nature: string; natureScore: number; subskills: string[];
  subskillMap: Record<string, number>; cappedSubskill: number; finalScore: number;
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

  if (finalScore >= 80) {
    return `${naturePart}${subPart}性格・サブスキルともに理想に近い最強個体です！`;
  }
  if (finalScore >= 60) {
    return `${naturePart}${subPart}${missingSubs}さらに厳選するなら性格「${targetNature}」＋「${targetSubs}」を目指しましょう。`;
  }
  if (finalScore >= 40) {
    return `${naturePart}${subPart}${missingSubs}理想個体は性格「${targetNature}」＋サブスキルに「${targetSubs}」の組み合わせです。`;
  }
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
  "subskills": ["サブスキル1", "サブスキル2", "サブスキル3", "サブスキル4", "サブスキル5"],
  "ingredients": ["食材1", "食材2"]
}

※サブスキルは取得済みのもののみ（未取得は含めない）
※食材はLv30・Lv60のもの（取得済みのみ）
※読み取れない項目はnullにする`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
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

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  let parsed;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch {
    return NextResponse.json({ error: "読み取りに失敗しました。別の画像をお試しください。" }, { status: 422 });
  }

  const { pokemonName, nature, subskills, ingredients } = parsed;

  const missing: string[] = [];
  if (!pokemonName) missing.push("ポケモン名");
  if (!nature) missing.push("性格");
  if (!subskills || subskills.length === 0) missing.push("サブスキル");
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `画像から「${missing.join("・")}」が読み取れませんでした。\nサブスキルと性格が両方映っているポケモンの詳細画面のスクショをお使いください。` },
      { status: 422 }
    );
  }

  const subskillMap = SUBSKILL_SCORES[type] ?? {};
  const natureMap = NATURE_SCORES[type] ?? {};

  const natureScore = natureMap[nature] ?? 0;
  const subskillScore = (subskills ?? []).reduce((sum: number, s: string) => sum + (subskillMap[s] ?? 2), 0);
  const ingredientScore = (ingredients ?? []).reduce((sum: number, i: string) => sum + (INGREDIENT_SCORES[i] ?? 5), 0);

  const cappedSubskill = Math.min(subskillScore, 60);
  const cappedIngredient = Math.min(ingredientScore, 20);
  const total = natureScore + cappedSubskill + cappedIngredient;
  const finalScore = Math.min(total, 100);

  const grade = getGrade(finalScore);

  const comment = buildComment({ type, nature, natureScore, subskills: subskills ?? [], subskillMap, cappedSubskill, finalScore });

  return NextResponse.json({
    pokemonName,
    type,
    nature,
    subskills: subskills ?? [],
    ingredients: ingredients ?? [],
    scores: {
      nature: natureScore,
      subskill: cappedSubskill,
      ingredient: cappedIngredient,
      total: finalScore,
    },
    grade,
    comment,
  });
}
