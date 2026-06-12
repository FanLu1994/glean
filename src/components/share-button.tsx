// src/components/share-button.tsx
"use client";

export function ShareButton({ text }: { text: string }) {
  return (
    <button
      onClick={() => navigator.clipboard.writeText(text)}
      className="px-4 py-2 border border-ink/20 rounded hover:bg-cream transition-colors text-ink-light"
    >
      分享
    </button>
  );
}
