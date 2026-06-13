// src/components/share-button.tsx
"use client";

export function ShareButton({ text }: { text: string }) {
  return (
    <button
      onClick={() => navigator.clipboard.writeText(text)}
      className="bg-transparent px-1 py-3 text-ink-light hover:text-ink"
    >
      分享
    </button>
  );
}
