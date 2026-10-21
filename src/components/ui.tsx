import Link from "next/link";
import type { ReactNode } from "react";

/** Logo mark: a folded policy page with a check: "your document, verified". */
export function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M7 3h13l6 6v18a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" fill="var(--accent)" />
      <path d="M20 3v4a2 2 0 0 0 2 2h4" fill="var(--accent-hover)" opacity=".55" />
      <path d="m10.5 17.5 3.6 3.6 7.4-7.6" fill="none" stroke="var(--accent-ink)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="9" y="7" width="7" height="2" rx="1" fill="var(--accent-ink)" opacity=".55" />
    </svg>
  );
}

export function TopBar({ right }: { right?: ReactNode }) {
  return (
    <nav className="sticky top-0 z-30 border-b border-line/70 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="ClaimClear home">
          <Logo />
          <span className="text-[15px] font-semibold tracking-tight">ClaimClear</span>
          <span className="hidden rounded-full border border-line px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted sm:inline">
            Beta
          </span>
        </Link>
        <div className="flex items-center gap-5 text-sm text-muted">{right}</div>
      </div>
    </nav>
  );
}

export function StepHeader({ n, title, subtitle, state }: { n: number; title: string; subtitle?: string; state: "todo" | "active" | "done" }) {
  return (
    <div className="flex items-start gap-3.5">
      <span
        className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold transition-colors ${
          state === "done" ? "bg-accent text-accent-ink" : state === "active" ? "bg-ink text-bg" : "bg-surface-2 text-faint"
        }`}
        aria-hidden
      >
        {state === "done" ? "✓" : n}
      </span>
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
    </div>
  );
}

export const card = "rounded-3xl border border-line bg-surface shadow-card";
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-ink transition hover:bg-accent-hover active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40";
export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium transition hover:border-faint hover:bg-surface-2 disabled:opacity-40";
