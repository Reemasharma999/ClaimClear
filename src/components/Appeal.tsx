"use client";

import { Check, Copy, Download, FileSignature, Loader2 } from "lucide-react";
import { useState } from "react";
import { post } from "@/lib/client";
import type { Answer } from "@/lib/pipeline";
import { btnGhost, btnPrimary, card } from "./ui";

export function Appeal({ answer, scenario }: { answer: Answer; scenario: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [letter, setLetter] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function draft() {
    setBusy(true);
    setErr(null);
    try {
      setLetter((await post<{ letter: string }>("/api/appeal", { scenario, answer, rejectionReason: reason })).letter);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const copy = async () => {
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  const download = () => {
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([letter], { type: "text/plain" })),
      download: "claim-grievance-letter.txt",
    });
    a.click();
  };

  return (
    <section className={`${card} rise overflow-hidden`}>
      <div className="flex flex-wrap items-center gap-5 p-6 sm:p-8">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-bg">
          <FileSignature className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Claim already rejected?</p>
          <p className="text-sm text-muted">
            About 71% of ombudsman cases end in the policyholder&apos;s favour. Get a grievance letter that cites your policy and only
            verified IRDAI rules.
          </p>
        </div>
        {!open && (
          <button onClick={() => setOpen(true)} className={btnGhost}>
            Draft a letter
          </button>
        )}
      </div>

      {open && (
        <div className="border-t border-line bg-bg p-6 sm:p-8">
          <label className="text-sm font-medium" htmlFor="reason">
            What reason did the insurer give?
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. “Pre-existing disease not disclosed”"
              className="flex-1 rounded-full border border-line bg-surface px-5 py-3 text-sm outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
            />
            <button onClick={draft} disabled={busy} className={btnPrimary}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {busy ? "Drafting…" : letter ? "Redraft" : "Draft letter"}
            </button>
          </div>
          {err && <p className="mt-3 text-sm text-bad">{err}</p>}

          {letter && (
            <div className="rise mt-6">
              <div className="paper max-h-[480px] overflow-y-auto rounded-2xl border border-line px-6 py-6 font-serif text-[17px] leading-[28px] shadow-card sm:px-10">
                <p className="whitespace-pre-wrap">{letter}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={copy} className={btnGhost}>
                  {copied ? <Check className="h-4 w-4 text-good" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy letter"}
                </button>
                <button onClick={download} className={btnGhost}>
                  <Download className="h-4 w-4" /> Download .txt
                </button>
              </div>
              <p className="mt-3 text-xs text-faint">Fill in the [bracketed] details and check every fact before sending. This is a draft, not legal advice.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
