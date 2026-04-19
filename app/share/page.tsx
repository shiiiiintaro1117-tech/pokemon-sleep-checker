import { Metadata } from "next";
import Link from "next/link";

type Props = {
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const name = params.name || "ポケモン";
  const type = params.type || "";
  const score = params.score || "0";
  const grade = params.grade || "ノーマル";
  const nature = params.nature || "";
  const subskills = params.subskills || "";

  const ogUrl = `https://pokemon-sleep-checker.vercel.app/api/og?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}&score=${encodeURIComponent(score)}&grade=${encodeURIComponent(grade)}&nature=${encodeURIComponent(nature)}&subskills=${encodeURIComponent(subskills)}`;

  const title = `${name}（${type}タイプ）${score}点 ${grade} | ポケスリ個体値チェッカー`;
  const description = `${name}の個体値採点結果：${score}点（${grade}）。性格：${nature}。ポケスリ個体値チェッカーで採点してみよう！`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}

export default async function SharePage({ searchParams }: Props) {
  const params = await searchParams;
  const name = params.name || "ポケモン";
  const type = params.type || "";
  const score = params.score || "0";
  const grade = params.grade || "ノーマル";

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "linear-gradient(160deg, #0a0f2e 0%, #0d1b4b 40%, #1a0a3e 100%)" }}
    >
      <div className="text-center text-white max-w-md">
        <div className="text-5xl mb-4">🌙</div>
        <h1 className="text-2xl font-black mb-2">ポケスリ個体値チェッカー</h1>
        <p className="text-blue-300 text-sm mb-6">
          {name}（{type}タイプ）のスコア：{score}点 / {grade}
        </p>
        <Link
          href="/"
          className="inline-block bg-gradient-to-r from-blue-500 to-violet-500 text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition"
        >
          ✨ 自分のポケモンも採点する
        </Link>
      </div>
    </main>
  );
}
