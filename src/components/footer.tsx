// src/components/footer.tsx
export function Footer() {
  return (
    <footer className="w-full max-w-2xl mx-auto px-4 py-6 text-center text-xs text-ink-light border-t border-ink/10">
      © {new Date().getFullYear()} 拾句 · Glean
    </footer>
  );
}
