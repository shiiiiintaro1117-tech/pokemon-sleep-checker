#!/usr/bin/env node
// AI駆動SNS投稿案ジェネレーター
// スケジュール: 月曜朝・水曜夜・土曜朝 (JST)

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "../..");

// ============================================================
// スケジュール定義 (dayOfWeek: 0=日, 1=月 ... 6=土)
// ============================================================
const SCHEDULE = {
  "1-morning": true,  // 月曜朝 07:00
  "3-evening": true,  // 水曜夜 21:00
  "6-morning": true,  // 土曜朝 07:00
};

const DAY_NAMES_JA = ["日", "月", "火", "水", "木", "金", "土"];
const SLOT_EMOJIS = { morning: "🌅", noon: "☀️", evening: "🌙" };
const SLOT_NAMES_JA = { morning: "朝", noon: "昼", evening: "夜" };

// ============================================================
// 環境変数 / 設定
// ============================================================

async function loadLocalEnv() {
  const envPath = path.resolve(ROOT_DIR, ".env.local");
  let raw = "";
  try { raw = await readFile(envPath, "utf8"); } catch { return; }
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const sep = trimmed.indexOf("=");
    if (sep === -1) continue;
    const key = trimmed.slice(0, sep).trim();
    let value = trimmed.slice(sep + 1).trim();
    if (!key || (process.env[key] !== undefined && process.env[key] !== "")) continue;
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

const DEFAULT_CONFIG = {
  type: "pokesleep",
  topic: "ポケモンスリープ",
  siteUrl: "https://pokemon-sleep-checker.vercel.app",
  discord: { username: "ポケスリSNS補助Bot" },
};

async function loadConfig(configPath) {
  if (!configPath) return DEFAULT_CONFIG;
  const raw = await readFile(path.resolve(ROOT_DIR, configPath), "utf8");
  const user = JSON.parse(raw);
  return { ...DEFAULT_CONFIG, ...user, discord: { ...DEFAULT_CONFIG.discord, ...(user.discord ?? {}) } };
}

// ============================================================
// JST スケジュール検出
// ============================================================

function getJSTSchedule() {
  const now = new Date();
  const jst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const dayOfWeek = jst.getDay();
  const hour = jst.getHours();
  let slot;
  if (hour >= 5 && hour < 11) slot = "morning";
  else if (hour >= 11 && hour < 17) slot = "noon";
  else slot = "evening";
  return { dayOfWeek, slot };
}

function shouldRun(dayOfWeek, slot, force) {
  if (force) return true;
  return !!SCHEDULE[`${dayOfWeek}-${slot}`];
}

// ============================================================
// Webリサーチ
// ============================================================

async function fetchUrl(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SocialAssistantBot/2.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function extractRSSItems(xml, max = 6) {
  if (!xml) return [];
  const items = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRe.exec(xml)) !== null && items.length < max) {
    const block = m[1];
    const title = (block.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s)?.[1] ?? "").trim().slice(0, 120);
    const desc = (block.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)?.[1] ?? "")
      .replace(/<[^>]+>/g, "").replace(/&[a-z]+;/gi, " ").trim().slice(0, 160);
    if (title.length > 4) items.push({ title, desc });
  }
  return items;
}

// 月曜朝: トレンドリサーチ
async function researchMonday(config) {
  const lines = [];
  const isPokeSleep = config.type === "pokesleep";

  if (isPokeSleep) {
    const rss = await fetchUrl("https://www.reddit.com/r/PokemonSleep/top.rss?t=week");
    const items = extractRSSItems(rss, 5);
    if (items.length) {
      lines.push("【Reddit r/PokemonSleep 今週の人気話題】");
      items.forEach(i => lines.push(`・${i.title}`));
    }
  } else {
    // ペダルアングラー: 釣り・自転車ニュース
    const fishRss = await fetchUrl(
      "https://news.google.com/rss/search?q=%E9%87%A3%E3%82%8A+%E6%96%B0%E8%A3%BD%E5%93%81&hl=ja&gl=JP&ceid=JP:ja"
    );
    const fishItems = extractRSSItems(fishRss, 3);
    if (fishItems.length) {
      lines.push("【釣り関連ニュース】");
      fishItems.forEach(i => lines.push(`・${i.title}`));
    }
    const bikeRss = await fetchUrl(
      "https://news.google.com/rss/search?q=%E3%82%B5%E3%82%A4%E3%82%AF%E3%83%AA%E3%83%B3%E3%82%B0+%E6%96%B0%E8%A3%BD%E5%93%81&hl=ja&gl=JP&ceid=JP:ja"
    );
    const bikeItems = extractRSSItems(bikeRss, 3);
    if (bikeItems.length) {
      lines.push("【サイクリング関連ニュース】");
      bikeItems.forEach(i => lines.push(`・${i.title}`));
    }
  }

  return lines.length ? lines.join("\n") : "";
}

// 水曜夜 ペダルアングラー: ブログ最新記事取得
async function researchBlogProducts(siteUrl) {
  const candidateUrls = [
    `${siteUrl.replace(/\/$/, "")}/feed`,
    `${siteUrl.replace(/\/$/, "")}/feed.xml`,
    `${siteUrl.replace(/\/$/, "")}/rss.xml`,
  ];
  for (const url of candidateUrls) {
    const rss = await fetchUrl(url);
    const items = extractRSSItems(rss, 4);
    if (items.length) return items;
  }
  // フォールバック: HTMLからh2/h3を抽出
  const html = await fetchUrl(siteUrl);
  if (!html) return [];
  const titles = [];
  const hRe = /<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi;
  let m;
  while ((m = hRe.exec(html)) !== null && titles.length < 5) {
    const text = m[1].replace(/<[^>]+>/g, "").trim();
    if (text.length > 5) titles.push({ title: text, desc: "" });
  }
  return titles;
}

// 水曜夜 ポケスリ: 注目ポケモン調査
async function researchFeaturedPokemon() {
  const lines = [];
  const rss = await fetchUrl("https://www.reddit.com/r/PokemonSleep/new.rss");
  const items = extractRSSItems(rss, 6);
  if (items.length) {
    lines.push("【r/PokemonSleep 最新投稿】");
    items.forEach(i => lines.push(`・${i.title}${i.desc ? ": " + i.desc.slice(0, 80) : ""}`));
  }
  return lines.length ? lines.join("\n") : "";
}

// ============================================================
// Claude API 呼び出し
// ============================================================

async function callClaude(prompt, apiKey) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Claude API error: ${res.status} ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

function parseIdeas(text) {
  // 【案1】〜【案2】〜【案3】 形式を優先
  const byTag = [...text.matchAll(/【案\d+】\s*([\s\S]*?)(?=【案\d+】|$)/g)]
    .map(m => m[1].trim()).filter(t => t.length > 5);
  if (byTag.length >= 2) return byTag.slice(0, 3);

  // 番号付きリスト
  const byNum = [...text.matchAll(/^\s*\d+[.、)\]]\s*([\s\S]*?)(?=^\s*\d+[.、)\]]|\Z)/gm)]
    .map(m => m[1].trim()).filter(t => t.length > 5);
  if (byNum.length >= 2) return byNum.slice(0, 3);

  // 段落分割
  return text.split(/\n{2,}/).map(p => p.trim()).filter(p => p.length > 10).slice(0, 3);
}

async function generateIdeas(dayOfWeek, slot, config, apiKey) {
  const isPokeSleep = config.type === "pokesleep";
  const isPedalangler = config.type === "pedalangler";
  const topic = config.topic;
  const siteUrl = config.siteUrl ?? "";
  let researchContext = "";
  let contentTypeDesc = "";

  if (dayOfWeek === 1 && slot === "morning") {
    contentTypeDesc = "今週のトレンド・時事ネタをもとにした興味喚起投稿";
    const research = await researchMonday(config);
    if (research) researchContext = `\n\n【収集した最新情報】\n${research}`;

  } else if (dayOfWeek === 3 && slot === "evening") {
    if (isPedalangler) {
      contentTypeDesc = "ブログで紹介した商品の魅力・使用感を伝えるレビュー投稿";
      const posts = await researchBlogProducts(siteUrl);
      if (posts.length) {
        researchContext = `\n\n【ブログ最新記事（商品候補）】\n${posts.map(p => `・${p.title}`).join("\n")}`;
      }
    } else {
      contentTypeDesc = "今週コミュニティで注目されているポケモンの深掘り解説投稿";
      const pokemon = await researchFeaturedPokemon();
      if (pokemon) researchContext = `\n\n【コミュニティ最新情報】\n${pokemon}`;
    }

  } else if (dayOfWeek === 6 && slot === "morning") {
    contentTypeDesc = isPedalangler
      ? "週末の釣り・サイクリングへの行動を促す投稿"
      : "週末のポケスリプレイ・厳選を楽しみにさせる投稿";
  }

  const accountDesc = isPedalangler
    ? `「自転車で釣りに行く」ペダルアングラースタイルを提案するブログ（${siteUrl}）のSNSアカウント`
    : `ポケモンスリープの個体値チェッカーサイト（${siteUrl}）の公式SNSアカウント`;

  const prompt = `あなたは${accountDesc}の中の人です。
テーマ: ${topic}
今日: ${DAY_NAMES_JA[dayOfWeek]}曜${SLOT_NAMES_JA[slot]}
投稿タイプ: ${contentTypeDesc}
${researchContext}

上記をもとに、Bluesky/X向け日本語SNS投稿案を **3件** 作成してください。

【条件】
- 各投稿は140文字以内
- 読者が「いいね」「返信」したくなる自然な文体
- 宣伝臭は最小限。共感・有益情報・問いかけを意識する
- ハッシュタグは各投稿1〜2個まで
- 必ず「【案1】」「【案2】」「【案3】」で始める

投稿案:`;

  const raw = await callClaude(prompt, apiKey);
  const ideas = parseIdeas(raw);

  while (ideas.length < 3) ideas.push(`${topic}についての投稿をお届けします。`);
  return ideas.slice(0, 3);
}

// ============================================================
// Discord 送信
// ============================================================

async function sendDiscordMsg(content, config, webhookUrl) {
  const res = await fetch(`${webhookUrl}?wait=true`, {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": "social-assistant/2.0" },
    body: JSON.stringify({ username: config.discord.username, content, allowed_mentions: { parse: [] } }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Discord送信失敗: ${res.status} ${body.slice(0, 160)}`);
  }
}

async function sendToDiscord(ideas, dayOfWeek, slot, config, webhookUrl) {
  if (!webhookUrl) throw new Error("DISCORD_WEBHOOK_URL が未設定です");
  const label = `${SLOT_EMOJIS[slot]} ${DAY_NAMES_JA[dayOfWeek]}曜${SLOT_NAMES_JA[slot]}の投稿案`;
  await sendDiscordMsg(`**${label}**`, config, webhookUrl);
  for (const idea of ideas) await sendDiscordMsg(idea, config, webhookUrl);
  return 1 + ideas.length;
}

// ============================================================
// レポート保存
// ============================================================

async function writeReport(ideas, dayOfWeek, slot, outPath) {
  const reportDir = path.resolve(ROOT_DIR, "reports/social-assistant");
  await mkdir(reportDir, { recursive: true });

  const generatedAt = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  const label = `${SLOT_EMOJIS[slot]} ${DAY_NAMES_JA[dayOfWeek]}曜${SLOT_NAMES_JA[slot]}の投稿案`;
  const content = [
    `# SNS投稿案（${label}）`,
    `生成日時: ${generatedAt}`,
    "",
    ...ideas.map((idea, i) => `## 案${i + 1}\n${idea}`),
  ].join("\n\n");

  const date = new Date().toISOString().slice(0, 10);
  const daySlug = ["sun","mon","tue","wed","thu","fri","sat"][dayOfWeek];
  const latestPath = path.resolve(reportDir, "latest.md");
  const datedPath = path.resolve(reportDir, `${date}-${daySlug}-${slot}.md`);

  await writeFile(latestPath, content, "utf8");
  await writeFile(datedPath, content, "utf8");
  if (outPath) {
    const resolved = path.resolve(ROOT_DIR, outPath);
    await mkdir(path.dirname(resolved), { recursive: true });
    await writeFile(resolved, content, "utf8");
  }
  return { latestPath, datedPath };
}

// ============================================================
// CLI 引数パース
// ============================================================

function parseArgs(argv) {
  const args = {
    configPath: null, outPath: null,
    discord: false, discordWebhookUrl: null,
    force: false, dayOverride: null, slotOverride: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--config") args.configPath = argv[++i];
    else if (arg === "--out") args.outPath = argv[++i];
    else if (arg === "--discord") args.discord = true;
    else if (arg === "--discord-webhook-url") args.discordWebhookUrl = argv[++i];
    else if (arg === "--force") args.force = true;
    else if (arg === "--day") args.dayOverride = Number(argv[++i]);
    else if (arg === "--slot") args.slotOverride = argv[++i];
  }
  return args;
}

// ============================================================
// メイン
// ============================================================

async function main() {
  await loadLocalEnv();

  const args = parseArgs(process.argv.slice(2));
  const config = await loadConfig(args.configPath);
  const { dayOfWeek, slot } = getJSTSchedule();

  const effectiveDay  = args.dayOverride  ?? dayOfWeek;
  const effectiveSlot = args.slotOverride ?? slot;

  if (!shouldRun(effectiveDay, effectiveSlot, args.force)) {
    console.log(`スケジュール外（${DAY_NAMES_JA[effectiveDay]}曜 ${effectiveSlot}）。スキップします。`);
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY が未設定です");

  console.log(`投稿案を生成中... (${DAY_NAMES_JA[effectiveDay]}曜 ${effectiveSlot})`);
  const ideas = await generateIdeas(effectiveDay, effectiveSlot, config, apiKey);

  const paths = await writeReport(ideas, effectiveDay, effectiveSlot, args.outPath);

  const webhookUrl = args.discordWebhookUrl ?? process.env.DISCORD_WEBHOOK_URL;
  if (args.discord) {
    const count = await sendToDiscord(ideas, effectiveDay, effectiveSlot, config, webhookUrl);
    console.log(`Discord送信完了: ${count}件`);
  }

  console.log(`レポート: ${paths.latestPath}`);
  console.log(`日付別: ${paths.datedPath}`);
}

main().catch(err => { console.error(err); process.exitCode = 1; });
