// src/lib/sources.ts
export const CLASSICAL_SOURCES = [
  "论语",
  "道德经",
  "庄子",
  "孟子",
  "诗经",
  "楚辞",
  "孙子兵法",
  "史记",
  "周易",
  "尚书",
  "礼记",
  "左传",
  "大学",
  "中庸",
  "荀子",
  "韩非子",
  "墨子",
  "吕氏春秋",
  "战国策",
  "古文观止",
  "唐诗三百首",
  "宋词三百首",
] as const;

export type ClassicalSource = (typeof CLASSICAL_SOURCES)[number];

/** Pick a random source, excluding the given set */
export function pickRandomSource(
  exclude: Set<string>
): ClassicalSource | null {
  const available = CLASSICAL_SOURCES.filter((s) => !exclude.has(s));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}
