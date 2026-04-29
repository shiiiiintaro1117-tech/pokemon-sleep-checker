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

function parseArgs(argv) {
  const args = {
    configPath: null,
    outPath: null,
    discord: false,
    discordWebhookUrl: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--config") args.configPath = argv[++index];
    else if (arg === "--out") args.outPath = argv[++index];
    else if (arg === "--discord") args.discord = true;
    else if (arg === "--discord-webhook-url") args.discordWebhookUrl = argv[++index];
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

function renderOwnPostIdeas(ownPostIdeas) {
  const sections = [
    ["朝の投稿案", ownPostIdeas.morning],
    ["昼の投稿案", ownPostIdeas.noon],
    ["夜の投稿案", ownPostIdeas.evening],
  ];

  return sections.flatMap(([title, ideas]) => [
    `### ${title}`,
    "",
    ...ideas.map((idea, index) => `${index + 1}. ${idea}`),
    "",
  ]);
}

function renderReport(config, generatedAt) {
  const ownPostIdeas = makeOwnPostIdeas(config.siteUrl, config);

  return [
    "# SNS投稿案",
    "",
    `生成日時: ${generatedAt}`,
    "",
    ...renderOwnPostIdeas(ownPostIdeas),
  ].join("\n");
}

async function writeReports(report, outPath) {
  const reportDir = path.resolve(ROOT_DIR, "reports/social-assistant");
  await mkdir(reportDir, { recursive: true });

  const date = new Date().toISOString().slice(0, 10);
  const latestPath = path.resolve(reportDir, "latest.md");
  const datedPath = path.resolve(reportDir, `${date}.md`);
  const resolvedOutPath = outPath ? path.resolve(ROOT_DIR, outPath) : null;

  await writeFile(latestPath, report, "utf8");
  await writeFile(datedPath, report, "utf8");
  if (resolvedOutPath) {
    await mkdir(path.dirname(resolvedOutPath), { recursive: true });
    await writeFile(resolvedOutPath, report, "utf8");
  }

  return { latestPath, datedPath, outPath: resolvedOutPath };
}

function splitDiscordContent(report) {
  const maxLength = 1850;
  const lines = report.split("\n");
  const chunks = [];
  let current = "";

  for (const line of lines) {
    const next = current ? `${current}\n${line}` : line;
    if (next.length <= maxLength) {
      current = next;
      continue;
    }

    if (current) chunks.push(current);

    if (line.length <= maxLength) {
      current = line;
      continue;
    }

    for (let index = 0; index < line.length; index += maxLength) {
      chunks.push(line.slice(index, index + maxLength));
    }
    current = "";
  }

  if (current) chunks.push(current);
  return chunks;
}

async function sendDiscordReport(report, config, webhookUrl) {
  if (!webhookUrl) {
    throw new Error("DISCORD_WEBHOOK_URL が未設定です。");
  }

  const chunks = splitDiscordContent(report);
  for (let index = 0; index < chunks.length; index += 1) {
    const suffix = chunks.length > 1 ? `\n\n_${index + 1}/${chunks.length}_` : "";
    const response = await fetch(`${webhookUrl}?wait=true`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "pokemon-sleep-checker-social-assistant/1.0",
      },
      body: JSON.stringify({
        username: config.discord.username,
        content: `${chunks[index]}${suffix}`,
        allowed_mentions: { parse: [] },
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Discord投稿失敗: ${response.status} ${response.statusText} ${body.slice(0, 160)}`);
    }
  }

  return chunks.length;
}

async function main() {
  await loadLocalEnv();

  const args = parseArgs(process.argv.slice(2));
  const config = await loadConfig(args.configPath);

  const generatedAt = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  const report = renderReport(config, generatedAt);
  const paths = await writeReports(report, args.outPath);
  const discordWebhookUrl = args.discordWebhookUrl ?? process.env.DISCORD_WEBHOOK_URL;

  if (args.discord) {
    const count = await sendDiscordReport(report, config, discordWebhookUrl);
    console.log(`Discord messages sent: ${count}`);
  }

  console.log(`Report written: ${paths.latestPath}`);
  console.log(`Dated report: ${paths.datedPath}`);
  if (paths.outPath) console.log(`Custom report: ${paths.outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
