// src/app/layout.tsx
import type { Metadata } from "next";
import { Noto_Serif_SC, Crimson_Pro } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

const notoSerifSC = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-serif-cn",
  display: "swap",
});

const crimsonPro = Crimson_Pro({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-serif-en",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "拾句 · Glean — 每日一句古文",
  description:
    "每日精选一句古文，配以拼音、释义、英译与现代使用场景。A daily classical Chinese quote with pinyin, explanation, English translation, and modern usage.",
  openGraph: {
    title: "拾句 · Glean",
    description: "每日一句古文智慧",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={`${notoSerifSC.variable} ${crimsonPro.variable}`}>
      <body className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
