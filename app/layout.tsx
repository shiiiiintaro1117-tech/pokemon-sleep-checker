import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ポケスリ個体値チェッカー｜スクショで自動採点",
  description: "ポケモンスリープのスクリーンショットを貼るだけで個体値を自動採点！性格・サブスキル・食材を総合評価してマスター〜ノーマルでランク付けします。",
  keywords: "ポケモンスリープ,個体値,チェッカー,採点,サブスキル,性格,厳選",
  openGraph: {
    title: "ポケスリ個体値チェッカー",
    description: "スクショを貼るだけで個体を自動採点！",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
