#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "../..");

const DEFAULT_CONFIG = {
  siteUrl: "https://pokemon-sleep-checker.vercel.app",
  discord: {
    username: "ポケスリSNS補助Bot",
  },
  postIdeas: null,
};

// 現在のJST時刻から朝/昼/夜を自動判定
// --slot morning/noon/evening で上書き可能
function detectSlot(override) {
  if (override) return override;
  const hour = Number(
    new Date().toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
      hour: "numeric",
      hour12: false,
    })
  );
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "noon";
  return "evening";
}

function parseArgs(argv) {
  const args = {
    configPath: null,
    outPath: null,
    discord: false,
    discordWebhookUrl: null,
    slot: null, // morning / noon / evening
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--config") args.configPath = argv[++index];
    else if (arg === "--out") args.outPath = argv[++index];
    else if (arg === "--discord") args.discord = true;
    else if (arg === "--discord-webhook-url") args.discordWebhookUrl = argv[++index];
    else if (arg === "--slot") args.slot = argv[++index];
  }

  return args;
}

async function loadConfig(configPath) {
  if (!configPath) return DEFAULT_CONFIG;

  const raw = await readFile(path.resolve(ROOT_DIR, configPath), "utf8");
  const userConfig = JSON.parse(raw);
  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
    discord: {
      ...DEFAULT_CONFIG.discord,
      ...(userConfig.discord ?? {}),
    },
  };
}

async function loadLocalEnv() {
  const envPath = path.resolve(ROOT_DIR, ".env.local");
  let raw = "";

  try {
    raw = await readFile(envPath, "utf8");
  } catch {
    return;
  }

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (!key || process.env[key] !== undefined) continue;

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function makeOwnPostIdeas(siteUrl, config) {
  if (config.postIdeas) return config.postIdeas;

  return {
    morning: [
      "おはようございます。今日のポケスリ、リサーチ結果で「育てるか迷う個体」いましたか？ 個体値だけじゃなく、性格とサブスキルの噛み合いまで見ると判断しやすいです。",
      "朝の厳選チェック。きのみSやおてスピ系は目立つけど、解放レベルが遠いと評価が変わることもあります。スクショでまとめて見るとかなり整理しやすいです。",
      `寝起きのポケスリ確認、強そうだけど判断に迷う個体が出たらスクショだけでざっくり確認できます。${siteUrl}`,
    ],
    noon: [
      "昼のポケスリメモ。食材タイプは「食材確率アップ」だけじゃなく、食材構成まで見ると印象が変わります。入力の手間を増やさず判断できる形を作りたいところ。",
      "厳選で迷った時は、スコアだけでなく24Hエナジー期待値も見ると使い道をイメージしやすいです。数字で見ると意外な個体が伸びることもあります。",
      "ポケスリのサブスキル評価、最大所持数アップやEXP系をどう見るかで迷いがち。エナジーに直結する要素と育成補助は分けて考えるとスッキリします。",
    ],
    evening: [
      "今日のリサーチ振り返り。みんなは個体値スコアと24Hエナジー期待値、どっちを重視して育成判断していますか？",
      "夜の厳選相談タイム。性格が微妙でもサブスキルが強い個体、逆に性格は良いけどスキルが惜しい個体、どちらを残すかいつも悩みます。",
      `今日出たポケモンの育成判断に迷ったら、スクショから個体値と24Hエナジーを確認できます。寝る前の整理にどうぞ。${siteUrl}`,
    ],
  };
}

const SLOT_LABELS = {
  morning: "🌅 朝の投稿案",
  noon: "☀️ 昼の投稿案",
  evening: "🌙 夜の投稿案",
};

async function writeReports(ideas, slot, outPath) {
  const reportDir = path.resolve(ROOT_DIR, "reports/social-assistant");
  await mkdir(reportDir, { recursive: true });

  const generatedAt = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  const content = [
    `# SNS投稿案（${SLOT_LABELS[slot]}）`,
    `生成日時: ${generatedAt}`,
    "",
    ...ideas.map((idea, i) => `## 案${i + 1}\n${idea}`),
  ].join("\n\n");

  const date = new Date().toISOString().slice(0, 10);
  const latestPath = path.resolve(reportDir, "latest.md");
  const datedPath = path.resolve(reportDir, `${date}-${slot}.md`);
  const resolvedOutPath = outPath ? path.resolve(ROOT_DIR, outPath) : null;

  await writeFile(latestPath, content, "utf8");
  await writeFile(datedPath, content, "utf8");
  if (resolvedOutPath) {
    await mkdir(path.dirname(resolvedOutPath), { recursive: true });
    await writeFile(resolvedOutPath, content, "utf8");
  }

  return { latestPath, datedPath, outPath: resolvedOutPath };
}

async function sendDiscordMessage(content, config, webhookUrl) {
  const response = await fetch(`${webhookUrl}?wait=true`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": "pokemon-sleep-checker-social-assistant/1.0",
    },
    body: JSON.stringify({
      username: config.discord.username,
      content,
      allowed_mentions: { parse: [] },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Discord投稿失敗: ${response.status} ${response.statusText} ${body.slice(0, 160)}`);
  }
}

async function sendDiscordIdeas(ideas, slot, config, webhookUrl) {
  if (!webhookUrl) {
    throw new Error("DISCORD_WEBHOOK_URL が未設定です。");
  }

  // ヘッダーを1通目に添える
  const label = SLOT_LABELS[slot];
  for (let i = 0; i < ideas.length; i += 1) {
    const prefix = i === 0 ? `**${label}**\n\n` : "";
    await sendDiscordMessage(`${prefix}${ideas[i]}`, config, webhookUrl);
  }

  return ideas.length;
}

async function main() {
  await loadLocalEnv();

  const args = parseArgs(process.argv.slice(2));
  const config = await loadConfig(args.configPath);
  const slot = detectSlot(args.slot);
  const postIdeas = makeOwnPostIdeas(config.siteUrl, config);
  const ideas = postIdeas[slot] ?? [];

  const paths = await writeReports(ideas, slot, args.outPath);
  const discordWebhookUrl = args.discordWebhookUrl ?? process.env.DISCORD_WEBHOOK_URL;

  if (args.discord) {
    const count = await sendDiscordIdeas(ideas, slot, config, discordWebhookUrl);
    console.log(`Discord messages sent: ${count}`);
  }

  console.log(`Slot: ${slot}`);
  console.log(`Report written: ${paths.latestPath}`);
  console.log(`Dated report: ${paths.datedPath}`);
  if (paths.outPath) console.log(`Custom report: ${paths.outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
