// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

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
    <html lang="zh-CN">
      <body className="min-h-[100dvh] flex flex-col">
        <Nav />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-16">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
