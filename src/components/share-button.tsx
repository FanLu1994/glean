// src/components/share-button.tsx
"use client";

export function ShareButton({ text }: { text: string }) {
  return (
    <button
      onClick={() => navigator.clipboard.writeText(text)}
      className="border border-ink/20 bg-cream/70 px-5 py-3 text-ink-light hover:border-cinnabar/40 hover:text-cinnabar"
    >
      分享
    </button>
  );
}
