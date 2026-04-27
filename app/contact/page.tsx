import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "お問い合わせ｜ポケスリ個体値チェッカー",
  description: "ポケスリ個体値チェッカーへのお問い合わせページです。不具合・ご要望・広告に関するお問い合わせはこちらからどうぞ。",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-950 via-blue-950 to-slate-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mb-8">
          ← トップに戻る
        </Link>

        <h1 className="text-2xl font-black mb-2">📬 お問い合わせ</h1>
        <p className="text-slate-400 text-sm mb-8">バグ報告・ご要望・その他お気軽にどうぞ</p>

        <div className="space-y-4 mb-8">
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="font-bold text-blue-300 mb-3">📧 メールでのお問い合わせ</h2>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              下記メールアドレスにお問い合わせ内容をご送付ください。<br />
              通常2〜3営業日以内にご返信いたします。
            </p>
            <a
              href="mailto:pokesleepchkr@gmail.com"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 transition text-white font-bold px-6 py-3 rounded-xl text-sm"
            >
              ✉️ pokesleepchkr@gmail.com
            </a>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="font-bold text-blue-300 mb-3">🦋 Blueskyでのお問い合わせ</h2>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              Blueskyのダイレクトメッセージまたはメンションでもお問い合わせいただけます。
            </p>
            <a
              href="https://bsky.app/profile/pokesleepchkr.bsky.social"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-sky-700 hover:bg-sky-600 transition text-white font-bold px-6 py-3 rounded-xl text-sm"
            >
              🦋 @pokesleepchkr.bsky.social
            </a>
          </div>
        </div>

        <div className="bg-blue-950 border border-blue-800 rounded-2xl p-5 text-sm text-blue-200 leading-relaxed mb-8">
          <h2 className="font-bold mb-2">📝 お問い合わせ前にご確認ください</h2>
          <ul className="space-y-2 text-slate-300">
            <li>・採点がうまくいかない場合は <Link href="/help" className="text-blue-400 underline">使い方ガイド</Link> をご確認ください</li>
            <li>・よくある質問は <Link href="/guide" className="text-blue-400 underline">攻略ガイド</Link> に掲載しています</li>
            <li>・いただいたご意見はサービス改善に活用させていただく場合があります</li>
          </ul>
        </div>

        <footer className="text-center text-slate-500 text-xs mt-10 space-y-2">
          <nav className="flex flex-wrap justify-center gap-4 text-slate-400">
            <Link href="/" className="hover:text-blue-300">トップ</Link>
            <Link href="/guide" className="hover:text-blue-300">攻略ガイド</Link>
            <Link href="/help" className="hover:text-blue-300">使い方</Link>
            <Link href="/about" className="hover:text-blue-300">運営者情報</Link>
            <Link href="/privacy" className="hover:text-blue-300">プライバシーポリシー</Link>
          </nav>
          <p>© 2025 ポケスリ個体値チェッカー</p>
        </footer>
      </div>
    </main>
  );
}
