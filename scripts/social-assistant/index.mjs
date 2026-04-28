#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "../..");

const DEFAULT_CONFIG = {
  queries: [
    "ポケスリ 個体値",
    "ポケモンスリープ 厳選",
    "ポケスリ 食材",
    "ポケスリ サブスキル",
  ],
  maxPostsPerQuery: 10,
  reportPostLimit: 12,
  excludeWords: ["交換", "販売", "プレゼント企画", "フォロバ", "副業", "エロ"],
  ownHandles: [],
  siteUrl: "https://pokemon-sleep-checker.vercel.app",
  discord: {
    username: "ポケスリSNS補助Bot",
  },
  replyTemplates: [
    "その性格、タイプによってはかなり強い組み合わせになりますね。",
    "サブスキルの解放状況まで見ると、判断がかなりスッキリしそうです。",
    "きのみ・食材・スキルどのタイプかで評価が変わってきますね。",
    "育成優先度に迷ったら、24Hエナジー期待値で比べると選びやすいです。",
    "性格とサブスキルの噛み合い、想像以上に影響が大きかったりします。",
    "解放済みのサブスキルの並び次第では、性格が惜しくても十分戦えることもありますよ。",
    "おてスピ系がどこに来るかで印象がかなり変わるタイプですね。",
    "最大所持数アップやEXP系のサブスキルをどう評価するか、いつも迷いどころです。",
    "スコアだけでなく食材構成まで絡むと、一気に複雑になりますよね。",
    "厳選の悩みあるある。スクショ一枚でざっくり確認できると少し楽になります。",
    "性格とサブスキルをまとめて採点して比べると判断しやすいです。{siteUrl}",
    "もし参考になれば、スクショから個体値をまとめてチェックできます。{siteUrl}",
  ],
};

const SAMPLE_POSTS = [
  {
    platform: "sample",
    id: "sample-1",
    author: "sleep-researcher.example",
    url: "https://example.com/sample-1",
    text: "ポケスリのゼニガメ、食材確率アップSとMがあるけど性格うっかりや。これ育てていいか悩む。",
    createdAt: new Date().toISOString(),
    metrics: { likeCount: 8, replyCount: 2, repostCount: 1 },
    query: "ポケスリ 個体値",
  },
  {
    platform: "sample",
    id: "sample-2",
    author: "berry-helper.example",
    url: "https://example.com/sample-2",
    text: "ベイリーフの厳選ラインがわからない。おてスピM、きのみS、食材確率Mなら強い？",
    createdAt: new Date().toISOString(),
    metrics: { likeCount: 15, replyCount: 5, repostCount: 3 },
    query: "ポケモンスリープ 厳選",
  },
  {
    platform: "sample",
    id: "sample-3",
    author: "recipe-note.example",
    url: "https://example.com/sample-3",
    text: "ポケスリ、食材タイプは食材構成まで見ると急に難しくなる。スクショだけで判断できたら楽そう。",
    createdAt: new Date().toISOString(),
    metrics: { likeCount: 22, replyCount: 1, repostCount: 4 },
    query: "ポケスリ 食材",
  },
];

const X_SEARCH_ENDPOINT = "https://api.x.com/2/tweets/search/recent";
const BSKY_SEARCH_ENDPOINTS = [
  "https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts",
  "https://bsky.social/xrpc/app.bsky.feed.searchPosts",
];

function parseArgs(argv) {
  const args = {
    configPath: null,
    sample: false,
    limit: null,
    outPath: null,
    discord: false,
    discordWebhookUrl: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--config") args.configPath = argv[++index];
    else if (arg === "--sample") args.sample = true;
    else if (arg === "--limit") args.limit = Number(argv[++index]);
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
    queries: userConfig.queries ?? DEFAULT_CONFIG.queries,
    excludeWords: userConfig.excludeWords ?? DEFAULT_CONFIG.excludeWords,
    ownHandles: userConfig.ownHandles ?? DEFAULT_CONFIG.ownHandles,
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

function normalizeHandle(handle) {
  return String(handle ?? "").replace(/^@/, "").toLowerCase();
}

function normalizeText(text) {
  return String(text ?? "").replace(/\s+/g, " ").trim();
}

function engagementScore(metrics = {}) {
  return (metrics.likeCount ?? 0) + (metrics.replyCount ?? 0) * 2 + (metrics.repostCount ?? 0) * 2;
}

function scorePost(post, config) {
  const text = normalizeText(post.text);
  const lowerAuthor = normalizeHandle(post.author);
  let score = engagementScore(post.metrics);

  const interestWords = [
    "個体値",
    "厳選",
    "サブスキル",
    "食材",
    "性格",
    "きのみ",
    "スキル確率",
    "おてスピ",
    "おてつだい",
    "エナジー",
  ];
  const questionWords = ["?", "？", "悩", "迷", "どう", "教えて", "わからない", "強い"];

  score += interestWords.filter((word) => text.includes(word)).length * 3;
  score += questionWords.filter((word) => text.includes(word)).length * 2;
  score -= config.excludeWords.filter((word) => text.includes(word)).length * 20;
  score -= (text.match(/https?:\/\//g) ?? []).length * 3;
  score -= (text.match(/#/g) ?? []).length > 4 ? 8 : 0;
  score -= text.length < 18 ? 8 : 0;
  score -= config.ownHandles.map(normalizeHandle).includes(lowerAuthor) ? 100 : 0;

  return score;
}

function shouldKeepPost(post, config) {
  const text = normalizeText(post.text);
  if (!text) return false;
  if (config.excludeWords.some((word) => text.includes(word))) return false;
  if (config.ownHandles.map(normalizeHandle).includes(normalizeHandle(post.author))) return false;
  return true;
}

function dedupePosts(posts) {
  const seen = new Set();
  return posts.filter((post) => {
    const key = `${post.platform}:${post.id || normalizeText(post.text).slice(0, 80)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "user-agent": "pokemon-sleep-checker-social-assistant/1.0",
      accept: "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`${response.status} ${response.statusText}: ${body.slice(0, 160)}`);
  }

  return response.json();
}

async function fetchXPosts(config, warnings) {
  const bearerToken = process.env.X_BEARER_TOKEN;
  if (!bearerToken) {
    warnings.push("X_BEARER_TOKEN が未設定のため、Xの検索はスキップしました。");
    return [];
  }

  const posts = [];
  for (const query of config.queries) {
    const params = new URLSearchParams({
      query: `${query} lang:ja -is:retweet`,
      max_results: String(Math.max(10, Math.min(100, config.maxPostsPerQuery))),
      "tweet.fields": "created_at,public_metrics,lang",
      expansions: "author_id",
      "user.fields": "username,name",
    });

    try {
      const data = await fetchJson(`${X_SEARCH_ENDPOINT}?${params}`, {
        headers: { authorization: `Bearer ${bearerToken}` },
      });
      const users = new Map((data.includes?.users ?? []).map((user) => [user.id, user]));

      for (const tweet of data.data ?? []) {
        const user = users.get(tweet.author_id);
        posts.push({
          platform: "X",
          id: tweet.id,
          author: user?.username ? `@${user.username}` : tweet.author_id,
          url: user?.username ? `https://x.com/${user.username}/status/${tweet.id}` : `https://x.com/i/web/status/${tweet.id}`,
          text: tweet.text,
          createdAt: tweet.created_at,
          metrics: {
            likeCount: tweet.public_metrics?.like_count ?? 0,
            replyCount: tweet.public_metrics?.reply_count ?? 0,
            repostCount: tweet.public_metrics?.retweet_count ?? 0,
          },
          query,
        });
      }
    } catch (error) {
      warnings.push(`X検索「${query}」に失敗しました: ${error.message}`);
    }
  }

  return posts;
}

async function getBskyAccessToken(warnings) {
  const identifier = process.env.BSKY_IDENTIFIER;
  const password = process.env.BSKY_APP_PASSWORD;
  if (!identifier || !password) return null;

  try {
    const res = await fetch("https://bsky.social/xrpc/com.atproto.server.createSession", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.accessJwt ?? null;
  } catch {
    warnings.push("Blueskyのセッション取得に失敗しました。検索はスキップします。");
    return null;
  }
}

async function fetchBlueskyPosts(config, warnings) {
  const posts = [];
  const accessToken = await getBskyAccessToken(warnings);

  for (const query of config.queries) {
    const params = new URLSearchParams({
      q: query,
      limit: String(Math.max(1, Math.min(100, config.maxPostsPerQuery))),
      sort: "latest",
    });

    try {
      let data = null;
      let lastError = null;
      for (const endpoint of BSKY_SEARCH_ENDPOINTS) {
        try {
          data = await fetchJson(`${endpoint}?${params}`, {
            headers: accessToken ? { authorization: `Bearer ${accessToken}` } : {},
          });
          break;
        } catch (error) {
          lastError = error;
        }
      }

      if (!data) throw lastError;

      for (const post of data.posts ?? []) {
        const record = post.record ?? {};
        const handle = post.author?.handle ?? "";
        posts.push({
          platform: "Bluesky",
          id: post.uri,
          author: handle ? `@${handle}` : post.author?.displayName ?? "unknown",
          url: handle && post.uri ? `https://bsky.app/profile/${handle}/post/${post.uri.split("/").pop()}` : "",
          text: record.text,
          createdAt: record.createdAt ?? post.indexedAt,
          metrics: {
            likeCount: post.likeCount ?? 0,
            replyCount: post.replyCount ?? 0,
            repostCount: post.repostCount ?? 0,
          },
          query,
        });
      }
    } catch (error) {
      warnings.push(`Bluesky検索「${query}」に失敗しました: ${error.message}`);
    }
  }

  return posts;
}

function makeReplyDrafts(post, siteUrl, config) {
  const templates = (config.replyTemplates ?? [])
    .map((t) => t.replace(/\{siteUrl\}/g, siteUrl));

  if (templates.length === 0) return [];

  // 投稿テキストに含まれるキーワードにマッチするテンプレートを優先し、
  // 残りをランダムで補完して3件選ぶ
  const text = normalizeText(post.text);
  const keywords = config.replyKeywords ?? [];
  const priority = templates.filter((t) =>
    keywords.some((kw) => text.includes(kw) && t.includes(kw))
  );
  const rest = templates.filter((t) => !priority.includes(t))
    .sort(() => Math.random() - 0.5);

  return [...priority, ...rest].slice(0, 3);
}

function makeOwnPostIdeas(siteUrl, config) {
  // configにpostIdeasが定義されていればそちらを優先
  if (config.postIdeas) {
    return config.postIdeas;
  }

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

function renderPost(post, index, config) {
  const drafts = makeReplyDrafts(post, config.siteUrl, config);
  return [
    `### ${index + 1}. ${post.platform} / ${post.author}`,
    "",
    `- URL: ${post.url || "(URLなし)"}`,
    `- 検索語: ${post.query}`,
    `- スコア: ${post.assistantScore}`,
    `- 反応目安: いいね ${post.metrics?.likeCount ?? 0} / 返信 ${post.metrics?.replyCount ?? 0} / RP ${post.metrics?.repostCount ?? 0}`,
    "",
    "> " + normalizeText(post.text).replace(/\n/g, "\n> "),
    "",
    "返信候補:",
    "",
    ...drafts.map((draft, draftIndex) => `${draftIndex + 1}. ${draft}`),
  ].join("\n");
}

function renderReport(posts, warnings, config, generatedAt) {
  const ownPostIdeas = makeOwnPostIdeas(config.siteUrl, config);

  return [
    "# ポケスリSNS補助レポート",
    "",
    `生成日時: ${generatedAt}`,
    "",
    "## 重要な前提",
    "",
    "- このレポートは返信候補と投稿改善案を作るだけです。",
    "- 自動いいね、自動投稿、自動フォロー、自動返信は行いません。",
    "- 候補文は必ず人が確認し、相手の投稿内容に合わせて編集してください。",
    "",
    "## 今日の投稿案",
    "",
    ...renderOwnPostIdeas(ownPostIdeas),
    "",
    "## 投稿前チェック",
    "",
    "- 最初の1行で、厳選・個体値・エナジー期待値などの興味ポイントが伝わるか。",
    "- スクショや数値がある場合、見どころを1つだけ添えているか。",
    "- 宣伝リンクだけにならず、相手や読者の判断に役立つ内容が入っているか。",
    "- 同じ文面を連投していないか。",
    "",
    "## 返信候補",
    "",
    posts.length ? posts.map((post, index) => renderPost(post, index, config)).join("\n\n") : "候補投稿は見つかりませんでした。",
    "",
    warnings.length ? ["## 注意", "", ...warnings.map((warning) => `- ${warning}`), ""].join("\n") : "",
  ].filter(Boolean).join("\n");
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
    throw new Error("DISCORD_WEBHOOK_URL が未設定です。Discordに投稿する場合はWebhook URLを設定してください。");
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
      throw new Error(`Discord投稿に失敗しました: ${response.status} ${response.statusText} ${body.slice(0, 160)}`);
    }
  }

  return chunks.length;
}

async function main() {
  await loadLocalEnv();

  const args = parseArgs(process.argv.slice(2));
  const config = await loadConfig(args.configPath);
  const warnings = [];

  const rawPosts = args.sample
    ? SAMPLE_POSTS
    : [
        ...(await fetchXPosts(config, warnings)),
        ...(await fetchBlueskyPosts(config, warnings)),
      ];

  const limit = args.limit ?? config.reportPostLimit;
  const posts = dedupePosts(rawPosts)
    .filter((post) => shouldKeepPost(post, config))
    .map((post) => ({
      ...post,
      text: normalizeText(post.text),
      assistantScore: scorePost(post, config),
    }))
    .filter((post) => post.assistantScore > -10)
    .sort((a, b) => b.assistantScore - a.assistantScore)
    .slice(0, limit);

  const generatedAt = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  const report = renderReport(posts, warnings, config, generatedAt);
  const paths = await writeReports(report, args.outPath);
  const discordWebhookUrl = args.discordWebhookUrl ?? process.env.DISCORD_WEBHOOK_URL;

  if (args.discord) {
    const count = await sendDiscordReport(report, config, discordWebhookUrl);
    console.log(`Discord messages sent: ${count}`);
  }

  console.log(`Report written: ${paths.latestPath}`);
  console.log(`Dated report: ${paths.datedPath}`);
  if (paths.outPath) console.log(`Custom report: ${paths.outPath}`);
  if (warnings.length) console.log(`Warnings: ${warnings.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
