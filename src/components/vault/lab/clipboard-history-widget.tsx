"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Check,
  ClipboardList,
  Copy,
  Eraser,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CLIPBOARD_LIMIT,
  clearClipboardHistory,
  listClipboardHistory,
  pushClipboardHistory,
  removeClipboardEntry,
  subscribeClipboardHistory,
  type ClipboardEntry,
} from "./lab-clipboard";
import { LabWidgetFrame } from "./lab-widget-shell";

function previewText(text: string, max = 96) {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max - 1)}…`;
}

function formatAge(at: number, now: number) {
  const delta = Math.max(0, Math.round((now - at) / 1000));
  if (delta < 5) return "just now";
  if (delta < 60) return `${delta}s ago`;
  if (delta < 3600) return `${Math.floor(delta / 60)}m ago`;
  return `${Math.floor(delta / 3600)}h ago`;
}

export function ClipboardHistoryWidget() {
  const reduceMotion = useReducedMotion();
  const [entries, setEntries] = useState<ClipboardEntry[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setEntries(listClipboardHistory());
    const unsub = subscribeClipboardHistory(setEntries);
    const tick = window.setInterval(() => setNow(Date.now()), 15_000);

    const onCopy = () => {
      const selection = window.getSelection()?.toString() ?? "";
      if (selection.trim()) {
        // document copy (Cmd+C) — writeText may not fire; record selection
        pushClipboardHistory(selection);
      }
    };
    document.addEventListener("copy", onCopy);

    return () => {
      unsub();
      window.clearInterval(tick);
      document.removeEventListener("copy", onCopy);
    };
  }, []);

  const bytes = useMemo(
    () =>
      entries.reduce(
        (sum, entry) => sum + new TextEncoder().encode(entry.text).length,
        0,
      ),
    [entries],
  );

  const copyAgain = async (entry: ClipboardEntry) => {
    try {
      await navigator.clipboard.writeText(entry.text);
      setCopiedId(entry.id);
      window.setTimeout(() => setCopiedId(null), 1200);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <LabWidgetFrame
      icon={ClipboardList}
      title="Clipboard history"
      subtitle={`session · last ${CLIPBOARD_LIMIT}`}
      badge={`${entries.length}/${CLIPBOARD_LIMIT}`}
      iconClassName="bg-[oklch(0.92_0.04_55)] text-[oklch(0.38_0.07_45)] dark:bg-[oklch(0.34_0.04_50)] dark:text-[oklch(0.9_0.03_70)]"
      preview={
        <div className="flex min-h-[340px] flex-1 flex-col">
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
            <p className="font-mono text-[10px] tracking-[0.14em] text-foreground/45 uppercase">
              Session stack
            </p>
            <span className="rounded-full bg-[oklch(0.94_0.04_150)] px-2 py-0.5 font-mono text-[10px] text-[oklch(0.38_0.08_150)] dark:bg-[oklch(0.3_0.04_150)] dark:text-[oklch(0.88_0.05_145)]">
              session
            </span>
          </div>

          <ul className="min-h-0 flex-1 space-y-2 overflow-auto p-3">
            <AnimatePresence initial={false}>
              {entries.length === 0 ? (
                <motion.li
                  key="empty"
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 px-6 text-center"
                >
                  <ClipboardList className="size-8 text-foreground/25" />
                  <p className="text-sm text-muted-foreground">
                    Copy anything in the vault this session — Lab buttons and
                    selection copies land here.
                  </p>
                </motion.li>
              ) : (
                entries.map((entry, index) => (
                  <motion.li
                    key={entry.id}
                    layout={!reduceMotion}
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                    className="group flex items-start gap-2 rounded-[12px] border border-border bg-background/80 p-2.5 shadow-sm"
                  >
                    <span className="mt-0.5 w-5 shrink-0 text-center font-mono text-[10px] text-foreground/35">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[12.5px] leading-5 break-words text-foreground">
                        {previewText(entry.text, 140)}
                      </p>
                      <p className="mt-1 font-mono text-[10px] text-foreground/40">
                        {formatAge(entry.at, now)} · {entry.text.length} chars
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1 opacity-80 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => void copyAgain(entry)}
                        className="rounded-md p-1.5 text-foreground/50 hover:bg-muted hover:text-foreground"
                        aria-label="Copy again"
                      >
                        {copiedId === entry.id ? (
                          <Check className="size-3.5" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeClipboardEntry(entry.id)}
                        className="rounded-md p-1.5 text-foreground/40 hover:bg-muted hover:text-destructive"
                        aria-label="Remove"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </motion.li>
                ))
              )}
            </AnimatePresence>
          </ul>
        </div>
      }
      controls={
        <div className="flex h-full flex-col gap-4">
          <div>
            <h3 className="font-display text-lg tracking-tight text-foreground">
              Recent copies
            </h3>
            <p className="mt-1 text-[13px] text-foreground/60">
              Keeps the last {CLIPBOARD_LIMIT} strings in{" "}
              <span className="font-mono text-[12px]">sessionStorage</span> for
              this tab — clears when the tab closes.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background/70 px-3 py-3">
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[12px] text-muted-foreground">
              <div className="flex justify-between gap-2">
                <dt>Entries</dt>
                <dd className="font-mono text-foreground">
                  {entries.length}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Limit</dt>
                <dd className="font-mono text-foreground">{CLIPBOARD_LIMIT}</dd>
              </div>
              <div className="col-span-2 flex justify-between gap-2 border-t border-border pt-2">
                <dt>Stored</dt>
                <dd className="font-mono text-foreground">
                  {bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-dashed border-border px-3 py-3 text-[12px] leading-relaxed text-muted-foreground">
            Capture hooks <code className="font-mono text-[11px]">clipboard.writeText</code>{" "}
            while Lab is open, plus native selection copies on this page.
          </div>

          <div className="mt-auto flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={entries.length === 0}
              onClick={() => clearClipboardHistory()}
            >
              <Eraser data-icon="inline-start" />
              Clear session
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              disabled={entries.length === 0}
              onClick={() =>
                void navigator.clipboard.writeText(
                  entries.map((entry) => entry.text).join("\n---\n"),
                )
              }
            >
              <Copy data-icon="inline-start" />
              Copy all
            </Button>
          </div>
        </div>
      }
    />
  );
}
