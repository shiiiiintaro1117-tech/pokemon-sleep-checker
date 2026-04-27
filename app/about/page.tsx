import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "運営者情報｜ポケスリ個体値チェッカー",
  description: "ポケスリ個体値チェッカーの運営者情報・サイト概要を掲載しています。",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-950 via-blue-950 to-slate-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mb-8">
          ← トップに戻る
        </Link>

        <h1 className="text-2xl font-black mb-8">📋 運営者情報</h1>

        <div className="space-y-6">

          <section className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="font-bold text-blue-300 mb-4 text-lg">サイト概要</h2>
            <table className="w-full text-sm text-slate-300 border-collapse">
              <tbody>
                <tr className="border-b border-slate-700">
                  <td className="py-3 pr-4 text-slate-400 w-32 shrink-0">サイト名</td>
                  <td className="py-3">ポケスリ個体値チェッカー</td>
                </tr>
                <tr className="border-b border-slate-700">
                  <td className="py-3 pr-4 text-slate-400">サイトURL</td>
                  <td className="py-3">https://pokemon-sleep-checker.vercel.app</td>
                </tr>
                <tr className="border-b border-slate-700">
                  <td className="py-3 pr-4 text-slate-400">開設日</td>
                  <td className="py-3">2025年</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-slate-400">目的</td>
                  <td className="py-3">ポケモンスリープの個体値チェックツールの提供</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="font-bold text-blue-300 mb-4 text-lg">運営者</h2>
            <table className="w-full text-sm text-slate-300 border-collapse">
              <tbody>
                <tr className="border-b border-slate-700">
                  <td className="py-3 pr-4 text-slate-400 w-32">運営者</td>
                  <td className="py-3">pokesleepchkr（個人運営）</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-slate-400">お問い合わせ</td>
                  <td className="py-3">
                    <Link href="/contact" className="text-blue-400 hover:text-blue-300 underline">
                      お問い合わせページ
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="font-bold text-blue-300 mb-4 text-lg">サイトについて</h2>
            <div className="text-sm text-slate-300 leading-relaxed space-y-3">
              <p>
                本サイトは、ポケモンスリープを楽しむプレイヤーが個体値の厳選をより快適に行えるよう、
                スクリーンショット1枚で自動採点できるツールを提供しています。
              </p>
              <p>
                AIによる画像解析を活用し、性格・サブスキルを自動で読み取り、
                きのみ・食材・スキルの各タイプに最適な個体かどうかを100点満点で評価します。
              </p>
              <p>
                本サイトはポケモンスリープの非公式ファンサイトです。
                「ポケットモンスター」「ポケモン」「Pokémon」は任天堂・クリーチャーズ・ゲームフリークの登録商標です。
                本サイトは株式会社ポケモン・任天堂・クリーチャーズ・ゲームフリークとは一切関係ありません。
              </p>
            </div>
          </section>

          <section className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="font-bold text-blue-300 mb-4 text-lg">広告について</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              本サイトはGoogle AdSenseによる広告を掲載しています。
              広告収入はサーバー費用・運営費用に充てています。
              広告に関するお問い合わせは
              <Link href="/contact" className="text-blue-400 hover:text-blue-300 underline ml-1">
                こちら
              </Link>
              からお願いします。
            </p>
          </section>

        </div>

        <footer className="text-center text-slate-500 text-xs mt-10 space-y-2">
          <nav className="flex flex-wrap justify-center gap-4 text-slate-400">
            <Link href="/" className="hover:text-blue-300">トップ</Link>
            <Link href="/guide" className="hover:text-blue-300">攻略ガイド</Link>
            <Link href="/help" className="hover:text-blue-300">使い方</Link>
            <Link href="/contact" className="hover:text-blue-300">お問い合わせ</Link>
            <Link href="/privacy" className="hover:text-blue-300">プライバシーポリシー</Link>
          </nav>
          <p>© 2025 ポケスリ個体値チェッカー</p>
        </footer>
      </div>
    </main>
  );
}
