export default function Privacy() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-950 via-blue-950 to-slate-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">プライバシーポリシー</h1>
        <div className="space-y-6 text-slate-300 text-sm leading-relaxed">
          <section>
            <h2 className="font-bold text-white mb-2">広告について</h2>
            <p>当サイトはGoogle AdSenseを利用しています。Googleはユーザーの興味に応じた広告を表示するためにCookieを使用することがあります。</p>
          </section>
          <section>
            <h2 className="font-bold text-white mb-2">アクセス解析について</h2>
            <p>当サイトはアクセス解析ツールを使用しています。これらはCookieを使用しており、個人を特定する情報は収集しません。</p>
          </section>
          <section>
            <h2 className="font-bold text-white mb-2">画像データについて</h2>
            <p>アップロードされたスクリーンショットは採点処理のみに使用し、サーバーに保存しません。</p>
          </section>
          <section>
            <h2 className="font-bold text-white mb-2">免責事項</h2>
            <p>本サイトはポケモンスリープの非公式ファンサイトです。株式会社ポケモン・任天堂とは無関係です。</p>
          </section>
        </div>
        <a href="/" className="mt-8 inline-block text-blue-400 hover:text-blue-300">← トップに戻る</a>
      </div>
    </main>
  );
}
