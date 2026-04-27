import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "プライバシーポリシー｜ポケスリ個体値チェッカー",
  description: "ポケスリ個体値チェッカーのプライバシーポリシー・個人情報の取り扱いについて説明します。",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-950 via-blue-950 to-slate-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mb-8">
          ← トップに戻る
        </Link>

        <h1 className="text-2xl font-black mb-2">🔒 プライバシーポリシー</h1>
        <p className="text-slate-400 text-sm mb-8">最終更新日：2025年</p>

        <div className="space-y-6 text-slate-300 text-sm leading-relaxed">

          <section className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="font-bold text-white mb-3 text-base">1. 基本方針</h2>
            <p>
              ポケスリ個体値チェッカー（以下「当サイト」）は、ユーザーのプライバシーを尊重し、
              個人情報の保護に努めます。本ポリシーは当サイトにおける個人情報の取り扱いについて説明するものです。
            </p>
          </section>

          <section className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="font-bold text-white mb-3 text-base">2. 収集する情報</h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-bold text-blue-300 mb-1">アップロード画像</h3>
                <p>
                  採点のためにアップロードされたスクリーンショットは、AI解析処理のみに使用します。
                  画像データはサーバーに保存せず、処理完了後に即座に削除されます。
                </p>
              </div>
              <div>
                <h3 className="font-bold text-blue-300 mb-1">アクセス情報</h3>
                <p>
                  Google アナリティクス等のアクセス解析ツールにより、
                  ページ閲覧数・参照元・ブラウザ情報等の統計データを収集することがあります。
                  これらは個人を特定できない形での集計データとして利用します。
                </p>
              </div>
              <div>
                <h3 className="font-bold text-blue-300 mb-1">お問い合わせ情報</h3>
                <p>
                  メールでのお問い合わせの際にご提供いただいた情報（メールアドレス・お名前等）は、
                  回答の目的のみに使用し、第三者への提供は行いません。
                </p>
              </div>
            </div>
          </section>

          <section className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="font-bold text-white mb-3 text-base">3. Cookieについて</h2>
            <p className="mb-3">
              当サイトでは、以下の目的でCookieおよび類似技術を使用しています。
            </p>
            <ul className="space-y-2 ml-4 list-disc text-slate-300">
              <li>サイトの利便性向上（設定の保存等）</li>
              <li>アクセス解析（Google アナリティクス）</li>
              <li>広告の最適化（Google AdSense）</li>
            </ul>
            <p className="mt-3">
              ブラウザの設定からCookieを無効にすることができますが、
              一部の機能が利用できなくなる場合があります。
            </p>
          </section>

          <section className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="font-bold text-white mb-3 text-base">4. 広告（Google AdSense）について</h2>
            <p className="mb-3">
              当サイトはGoogle AdSenseを利用した広告を掲載しています。
            </p>
            <ul className="space-y-2 ml-4 list-disc text-slate-300">
              <li>Googleはユーザーの過去の訪問履歴や興味・関心に基づいた広告を表示するためにCookieを使用します</li>
              <li>ユーザーはGoogleの広告設定ページでパーソナライズ広告を無効化できます</li>
              <li>詳細は
                <a
                  href="https://policies.google.com/technologies/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline mx-1"
                >
                  Googleの広告ポリシー
                </a>
                をご確認ください
              </li>
            </ul>
          </section>

          <section className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="font-bold text-white mb-3 text-base">5. 第三者サービスへの情報提供</h2>
            <p className="mb-3">
              当サイトでは以下の第三者サービスを利用しており、各社のプライバシーポリシーに基づいてデータが処理されます。
            </p>
            <div className="space-y-2">
              {[
                { name: "Google AdSense", url: "https://policies.google.com/privacy", desc: "広告配信" },
                { name: "Google Analytics", url: "https://policies.google.com/privacy", desc: "アクセス解析" },
                { name: "Anthropic Claude API", url: "https://www.anthropic.com/privacy", desc: "AI画像解析" },
                { name: "Vercel", url: "https://vercel.com/legal/privacy-policy", desc: "サーバー・ホスティング" },
              ].map((s) => (
                <div key={s.name} className="flex gap-3 items-start">
                  <span className="text-slate-400 shrink-0">{s.desc}：</span>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                    {s.name}
                  </a>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="font-bold text-white mb-3 text-base">6. 免責事項</h2>
            <div className="space-y-2">
              <p>本サイトはポケモンスリープの非公式ファンサイトです。「ポケットモンスター」「ポケモン」「Pokémon」は任天堂・クリーチャーズ・ゲームフリークの登録商標です。本サイトは株式会社ポケモン・任天堂・クリーチャーズ・ゲームフリークとは一切関係ありません。</p>
              <p>採点結果はAIによる推定値であり、正確性を保証するものではありません。サービスの利用により生じた損害について、当サイトは一切の責任を負いません。</p>
            </div>
          </section>

          <section className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="font-bold text-white mb-3 text-base">7. お問い合わせ</h2>
            <p>
              本ポリシーに関するご質問は、
              <Link href="/contact" className="text-blue-400 hover:text-blue-300 underline mx-1">
                お問い合わせページ
              </Link>
              よりご連絡ください。
            </p>
          </section>

        </div>

        <footer className="text-center text-slate-500 text-xs mt-10 space-y-2">
          <nav className="flex flex-wrap justify-center gap-4 text-slate-400">
            <Link href="/" className="hover:text-blue-300">トップ</Link>
            <Link href="/guide" className="hover:text-blue-300">攻略ガイド</Link>
            <Link href="/help" className="hover:text-blue-300">使い方</Link>
            <Link href="/about" className="hover:text-blue-300">運営者情報</Link>
            <Link href="/contact" className="hover:text-blue-300">お問い合わせ</Link>
          </nav>
          <p>© 2025 ポケスリ個体値チェッカー</p>
        </footer>
      </div>
    </main>
  );
}
