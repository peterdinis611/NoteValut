"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Copy, KeyRound, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "cn";
import { LabWidgetFrame } from "./lab-widget-shell";
import { createRng, randomSeed } from "./lab-utils";

type IdKind = "uuid" | "short" | "appwrite";

const KIND_META: Record<
  IdKind,
  { label: string; hint: string }
> = {
  uuid: {
    label: "UUID v4",
    hint: "NoteId / workspace / folder style",
  },
  short: {
    label: "Short code",
    hint: "8-char base36 shelf codes",
  },
  appwrite: {
    label: "Appwrite-like",
    hint: "20-char unique() style IDs",
  },
};

function generateId(kind: IdKind, seed?: string): string {
  if (kind === "uuid") {
    return crypto.randomUUID();
  }

  const alphabet =
    kind === "appwrite"
      ? "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
      : "abcdefghijklmnopqrstuvwxyz0123456789";
  const length = kind === "appwrite" ? 20 : 8;
  const rng = createRng(seed ?? randomSeed());
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[Math.floor(rng() * alphabet.length)]!;
  }
  return out;
}

function generateBatch(kind: IdKind, count: number): string[] {
  return Array.from({ length: count }, () => generateId(kind));
}

export function UuidWidget() {
  const reduceMotion = useReducedMotion();
  const [kind, setKind] = useState<IdKind>("uuid");
  const [count, setCount] = useState(5);
  const [ids, setIds] = useState(() => generateBatch("uuid", 5));
  const [copied, setCopied] = useState<"one" | "all" | null>(null);

  const refresh = (nextKind = kind, nextCount = count) => {
    const safe = Math.min(24, Math.max(1, Math.round(nextCount) || 1));
    setCount(safe);
    setKind(nextKind);
    setIds(generateBatch(nextKind, safe));
  };

  const copyOne = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied("one");
      window.setTimeout(() => setCopied(null), 1200);
    } catch {
      setCopied(null);
    }
  };

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(ids.join("\n"));
      setCopied("all");
      window.setTimeout(() => setCopied(null), 1200);
    } catch {
      setCopied(null);
    }
  };

  return (
    <LabWidgetFrame
      icon={KeyRound}
      title="UUID / ID factory"
      subtitle="fixtures · NoteId · Appwrite"
      badge={`${ids.length} ids`}
      iconClassName="bg-[oklch(0.9_0.05_75)] text-[oklch(0.35_0.08_70)] dark:bg-[oklch(0.34_0.05_75)] dark:text-[oklch(0.9_0.04_75)]"
      preview={
        <ul className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-auto p-3">
          <AnimatePresence initial={false}>
            {ids.map((id) => (
              <motion.li
                key={id}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                className="group flex items-center gap-2 rounded-[10px] border border-border bg-background/80 px-3 py-2"
              >
                <code className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-foreground">
                  {id}
                </code>
                <button
                  type="button"
                  onClick={() => void copyOne(id)}
                  className="rounded-md p-1.5 text-foreground/45 opacity-70 transition-colors hover:bg-muted hover:text-foreground group-hover:opacity-100"
                  aria-label={`Copy ${id}`}
                >
                  <Copy className="size-3.5" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      }
      controls={
        <>
          <div>
            <h3 className="font-display text-lg tracking-tight text-foreground">
              ID controls
            </h3>
            <p className="mt-1 text-[13px] text-foreground/60">
              Generate batch IDs for Effect fixtures, Appwrite rows, and shelf
              seeds.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(KIND_META) as IdKind[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => refresh(key, count)}
                className={cn(
                  "rounded-full border border-border px-3 py-1.5 text-[12px] text-foreground/70 transition-colors hover:bg-muted",
                  kind === key &&
                    "border-primary/40 bg-accent text-accent-foreground",
                )}
              >
                {KIND_META[key].label}
              </button>
            ))}
          </div>
          <p className="font-mono text-[11px] text-foreground/45">
            {KIND_META[kind].hint}
          </p>

          <label className="block space-y-1.5">
            <span className="text-[12px] text-foreground/60">Count</span>
            <Input
              type="number"
              min={1}
              max={24}
              value={count}
              onChange={(event) => {
                const next = Number(event.target.value);
                setCount(next);
              }}
              onBlur={() => refresh(kind, count)}
            />
          </label>

          <div className="mt-auto flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              className="rounded-xl"
              onClick={() => refresh(kind, count)}
            >
              <RefreshCw data-icon="inline-start" />
              Regenerate
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => void copyAll()}
            >
              {copied === "all" ? (
                <Check data-icon="inline-start" />
              ) : (
                <Copy data-icon="inline-start" />
              )}
              {copied === "all" ? "Copied" : "Copy all"}
            </Button>
          </div>
        </>
      }
    />
  );
}
