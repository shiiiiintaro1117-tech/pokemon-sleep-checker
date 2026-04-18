import Link from "next/link";

export const metadata = {
  title: "スクショの撮り方ガイド｜ポケスリ個体値チェッカー",
  description: "ポケモンスリープの個体値チェッカーで使うスクリーンショットの撮り方を解説します。",
};

export default function HelpPage() {
  return (
    <main className="relative min-h-screen text-white" style={{ background: "linear-gradient(160deg, #0a0f2e 0%, #0d1b4b 40%, #1a0a3e 100%)" }}>
      <div className="max-w-xl mx-auto px-4 py-10">

        <div className="mb-8">
          <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mb-6">
            ← トップに戻る
          </Link>
          <h1 className="text-2xl font-black mb-2">📱 スクショの撮り方ガイド</h1>
          <p className="text-slate-400 text-sm">どの画面を撮ればいいか迷っている方はこちら</p>
        </div>

        {/* ステップ */}
        <div className="space-y-4 mb-8">

          <Step number={1} title="ポケモンスリープを開く">
            <p>アプリを起動して、ホーム画面を表示します。</p>
          </Step>

          <Step number={2} title="「ポケモン」タブを開く">
            <p>画面下のメニューから <Strong>「ポケモン」</Strong> をタップします。</p>
          </Step>

          <Step number={3} title="採点したいポケモンをタップ">
            <p>一覧から採点したいポケモンを選んでタップします。</p>
          </Step>

          <Step number={4} title="詳細画面で「ステータス」を表示">
            <p>ポケモンの詳細画面を開き、<Strong>性格とサブスキルが両方見える状態</Strong>にします。</p>
            <div className="mt-3 bg-white/5 rounded-xl p-4 text-sm space-y-2">
              <p className="text-green-400 font-bold">✅ この情報が画面に映っていればOK</p>
              <ul className="text-slate-300 space-y-1 ml-2">
                <li>• ポケモンの名前</li>
                <li>• 性格（例：いじっぱり）</li>
                <li>• サブスキル（Lv10・25・50などで解放）</li>
              </ul>
            </div>
          </Step>

          <Step number={5} title="スクリーンショットを撮る">
            <div className="space-y-2 text-sm text-slate-300">
              <p><Strong>iPhone：</Strong>電源ボタン＋音量アップボタンを同時押し</p>
              <p><Strong>Android：</Strong>電源ボタン＋音量ダウンボタンを同時押し</p>
              <p className="text-slate-400 text-xs mt-2">※機種によって異なる場合があります</p>
            </div>
          </Step>

          <Step number={6} title="サイトにアップロードして採点">
            <p>撮ったスクショを <Link href="/" className="text-blue-400 underline">トップページ</Link> にアップロードすれば自動で採点します。</p>
          </Step>

        </div>

        {/* よくある失敗 */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 mb-6">
          <h2 className="font-bold text-red-300 mb-3">⚠️ よくある失敗</h2>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex gap-2">
              <span className="text-red-400 shrink-0">✗</span>
              <span><Strong>サブスキルが映っていない</Strong>：ポケモンの戦闘画面ではなく、詳細ステータス画面を撮ってください</span>
            </li>
            <li className="flex gap-2">
              <span className="text-red-400 shrink-0">✗</span>
              <span><Strong>Lv10未満のポケモン</Strong>：サブスキルはLv10以上にならないと表示されません</span>
            </li>
            <li className="flex gap-2">
              <span className="text-red-400 shrink-0">✗</span>
              <span><Strong>画像が暗い・ぼやけている</Strong>：明るい場所で画面の輝度を上げて撮影してください</span>
            </li>
          </ul>
        </div>

        {/* タイプの確認方法 */}
        <div className="bg-blue-500/10 border border-blue-400/30 rounded-2xl p-5 mb-8">
          <h2 className="font-bold text-blue-300 mb-3">🍓 得意なもの（タイプ）の確認方法</h2>
          <p className="text-sm text-slate-300 mb-3">
            サイトでは最初に「きのみ・食材・スキル」を手動で選ぶ必要があります。
            ポケモンの詳細画面に <Strong>「得意なもの」</Strong> として表示されているので確認してください。
          </p>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            {[
              { emoji: "🍓", label: "きのみ", desc: "きのみをたくさん拾う" },
              { emoji: "🥕", label: "食材", desc: "食材を集めてくる" },
              { emoji: "✨", label: "スキル", desc: "メインスキルをよく使う" },
            ].map((t) => (
              <div key={t.label} className="bg-white/5 rounded-xl p-3">
                <div className="text-2xl mb-1">{t.emoji}</div>
                <div className="font-bold text-white">{t.label}</div>
                <div className="text-slate-400 text-xs mt-1">{t.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="inline-block bg-gradient-to-r from-blue-500 to-violet-500 text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition"
          >
            ✨ さっそく採点する
          </Link>
        </div>

        <footer className="text-center text-slate-600 text-xs mt-10">
          <p>© 2025 ポケスリ個体値チェッカー ／ <Link href="/privacy" className="underline hover:text-slate-500">プライバシーポリシー</Link></p>
        </footer>
      </div>
    </main>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-b from-blue-500 to-violet-500 flex items-center justify-center font-black text-sm">
        {number}
      </div>
      <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4">
        <h3 className="font-bold text-white mb-2">{title}</h3>
        <div className="text-slate-300 text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function Strong({ children }: { children: React.ReactNode }) {
  return <span className="text-white font-bold">{children}</span>;
}
