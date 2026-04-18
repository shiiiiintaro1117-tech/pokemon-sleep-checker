import { BskyAgent } from "@atproto/api";
import "dotenv/config";

const IDENTIFIER = process.env.BSKY_IDENTIFIER;
const APP_PASSWORD = process.env.BSKY_APP_PASSWORD;
const SEARCH_QUERY = "ポケスリ";
const LIKE_COUNT = 10;

// 環境変数チェック
if (!IDENTIFIER || !APP_PASSWORD) {
  console.error(
    "エラー: BSKY_IDENTIFIER と BSKY_APP_PASSWORD を環境変数に設定してください"
  );
  process.exit(1);
}

// ランダムにN件選ぶ
function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// スリープ（レート制限対策）
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runAutoLike() {
  const now = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  console.log(`[${now}] 自動いいね開始`);

  const agent = new BskyAgent({ service: "https://bsky.social" });

  // ログイン
  await agent.login({ identifier: IDENTIFIER, password: APP_PASSWORD });
  console.log(`ログイン成功: ${IDENTIFIER}`);

  // 「ポケスリ」で検索（最大100件取得）
  const searchRes = await agent.app.bsky.feed.searchPosts({
    q: SEARCH_QUERY,
    limit: 100,
  });

  const posts = searchRes.data.posts;
  console.log(`「${SEARCH_QUERY}」で ${posts.length} 件取得`);

  if (posts.length === 0) {
    console.log("対象投稿が見つかりませんでした");
    return;
  }

  // 自分の投稿・すでにいいね済みを除外
  const targets = posts.filter(
    (post) =>
      post.author.did !== agent.session?.did &&
      !post.viewer?.like
  );

  console.log(`フィルター後: ${targets.length} 件が対象`);

  // ランダムにLIKE_COUNT件選ぶ
  const selected = pickRandom(targets, Math.min(LIKE_COUNT, targets.length));
  console.log(`${selected.length} 件をいいねします`);

  // いいね実行
  let successCount = 0;
  for (const post of selected) {
    try {
      await agent.like(post.uri, post.cid);
      const author = post.author.handle;
      const text = post.record?.text?.slice(0, 30) ?? "";
      console.log(`  ✅ @${author}: ${text}...`);
      successCount++;
      // 1件ごとに1〜2秒待機（レート制限対策）
      await sleep(1000 + Math.random() * 1000);
    } catch (err) {
      console.error(`  ❌ いいね失敗: ${err.message}`);
    }
  }

  console.log(`完了: ${successCount}/${selected.length} 件いいね成功`);
}

// 実行
runAutoLike().catch((err) => {
  console.error(`致命的エラー: ${err.message}`);
  process.exit(1);
});
