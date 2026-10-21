import { ArrowDown, FileSearch, Scale, ShieldCheck } from "lucide-react";

const STATS = [
  { value: "8%", label: "of health claims were rejected in FY25", src: "IRDAI Annual Report 2024-25" },
  { value: "₹26,000 Cr", label: "of claims disallowed in a single year", src: "Rajya Sabha answer, Feb 2025" },
  { value: "~71%", label: "of ombudsman cases end in the policyholder's favour", src: "Insurance Business, 2025" },
];

export function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-14 pt-12 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:pb-20 lg:pt-20">
      <div className="rise">
        <p className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
          <ShieldCheck className="h-3.5 w-3.5" /> For Indian health insurance policyholders
        </p>
        <h1 className="mt-5 font-serif text-[2.6rem] leading-[1.05] tracking-tight sm:text-6xl">
          Know what your insurer will pay, <em className="pr-[0.12em] text-accent">before</em> the hospital bill arrives.
        </h1>
        <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted">
          Describe the treatment in your own words. ClaimClear reads your policy clause by clause, tells you what&apos;s covered and what
          you&apos;ll pay, and shows you the exact sentence behind every answer.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted">
          <a href="#check" className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-semibold text-bg transition hover:opacity-90">
            Check a claim <ArrowDown className="h-4 w-4" />
          </a>
          <span className="flex items-center gap-1.5"><FileSearch className="h-4 w-4" /> Every answer cites your policy</span>
          <span className="flex items-center gap-1.5"><Scale className="h-4 w-4" /> Appeal letter if rejected</span>
        </div>
      </div>

      <ReceiptIllustration />

      <dl className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3 lg:col-span-2">
        {STATS.map((s, i) => (
          <div key={s.value} className="rise bg-surface px-5 py-5" style={{ animationDelay: `${150 + i * 80}ms` }}>
            <dt className="font-serif text-3xl tracking-tight">{s.value}</dt>
            <dd className="mt-1 text-sm text-muted">{s.label}</dd>
            <dd className="mt-2 text-[11px] text-faint">{s.src}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Static illustration of the product's output (labelled as such): a claim receipt plus a highlighted clause. */
function ReceiptIllustration() {
  return (
    <div className="rise relative mx-auto w-full max-w-md pb-16 sm:pb-20" style={{ animationDelay: "120ms" }} aria-hidden>
      <div className="paper absolute -left-6 bottom-0 z-10 hidden w-64 -rotate-3 rounded-2xl border border-line p-5 text-[12px] leading-[28px] shadow-float sm:block">
        <p className="font-mono text-[10px] uppercase tracking-wider text-faint">Page 4 · §5.2</p>
        <p>
          Knee or hip replacement surgery is <mark className="hl">payable up to Rs 1,50,000 per joint</mark>, including the cost of the implant.
        </p>
      </div>
      <div className="receipt relative ml-auto w-[88%] rotate-1 bg-surface px-6 py-8 shadow-float">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-warn-bg px-2.5 py-1 text-[11px] font-semibold text-warn">Partly covered</span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-faint">Illustration</span>
        </div>
        <p className="mt-3 font-serif text-xl leading-snug">Knee replacement · 30-month-old policy</p>
        <div className="dotted-rule my-4" />
        {[
          ["Hospital bill", "₹2,80,000"],
          ["Sub-limit §5.2", "− ₹1,30,000"],
          ["20% co-pay §6.1", "− ₹30,000"],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between py-1 text-sm">
            <span className="text-muted">{k}</span>
            <span className={`tabular-nums ${v.startsWith("−") ? "text-bad" : ""}`}>{v}</span>
          </div>
        ))}
        <div className="dotted-rule my-4" />
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium">You pay</span>
          <span className="font-serif text-3xl">₹1,60,000</span>
        </div>
      </div>
    </div>
  );
}
