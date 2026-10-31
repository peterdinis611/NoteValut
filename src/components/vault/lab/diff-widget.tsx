"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeftRight,
  Check,
  Copy,
  Diff,
  Eraser,
  Eye,
  EyeOff,
  RotateCcw,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "cn";
import { LabWidgetFrame } from "./lab-widget-shell";

type DiffKind = "equal" | "add" | "remove";

type WordSpan = { kind: DiffKind; text: string };

type DiffOp = {
  kind: DiffKind;
  text: string;
  leftNo?: number;
  rightNo?: number;
  words?: WordSpan[];
};

type DiffRow =
  | { type: "op"; op: DiffOp; key: string }
  | { type: "skip"; count: number; key: string };

const SAMPLE_A = `NoteValut Lab
Quiet workspace
Write · Guard · Keep
Ship the vault map
Calendar stays soft
`;

const SAMPLE_B = `NoteValut Lab
Quiet workspace for notes
Write · Guard · Keep
Polish the vault map
Calendar stays soft
Add lab widgets
`;

function normalizeLine(
  line: string,
  opts: { ignoreWs: boolean; ignoreCase: boolean },
) {
  let next = line;
  if (opts.ignoreWs) next = next.replace(/\s+/g, " ").trim();
  if (opts.ignoreCase) next = next.toLowerCase();
  return next;
}

function splitWords(text: string) {
  return text.match(/\s+|[^\s]+/g) ?? [];
}

/** Token LCS for word-level highlight inside a changed pair. */
function diffWords(a: string, b: string): WordSpan[] {
  const left = splitWords(a);
  const right = splitWords(b);
  const n = left.length;
  const m = right.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array.from({ length: m + 1 }, () => 0),
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i]![j] =
        left[i] === right[j]
          ? (dp[i + 1]![j + 1] ?? 0) + 1
          : Math.max(dp[i + 1]![j] ?? 0, dp[i]![j + 1] ?? 0);
    }
  }
  const out: WordSpan[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (left[i] === right[j]) {
      out.push({ kind: "equal", text: left[i]! });
      i += 1;
      j += 1;
    } else if ((dp[i + 1]![j] ?? 0) >= (dp[i]![j + 1] ?? 0)) {
      out.push({ kind: "remove", text: left[i]! });
      i += 1;
    } else {
      out.push({ kind: "add", text: right[j]! });
      j += 1;
    }
  }
  while (i < n) {
    out.push({ kind: "remove", text: left[i]! });
    i += 1;
  }
  while (j < m) {
    out.push({ kind: "add", text: right[j]! });
    j += 1;
  }
  return out;
}

function diffLines(
  leftRaw: string,
  rightRaw: string,
  opts: { ignoreWs: boolean; ignoreCase: boolean; wordLevel: boolean },
): DiffOp[] {
  const a = leftRaw.replace(/\r\n/g, "\n").split("\n");
  const b = rightRaw.replace(/\r\n/g, "\n").split("\n");
  if (a.length && a[a.length - 1] === "") a.pop();
  if (b.length && b[b.length - 1] === "") b.pop();

  const aKey = a.map((line) => normalizeLine(line, opts));
  const bKey = b.map((line) => normalizeLine(line, opts));
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array.from({ length: m + 1 }, () => 0),
  );

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i]![j] =
        aKey[i] === bKey[j]
          ? (dp[i + 1]![j + 1] ?? 0) + 1
          : Math.max(dp[i + 1]![j] ?? 0, dp[i]![j + 1] ?? 0);
    }
  }

  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  let leftNo = 1;
  let rightNo = 1;

  while (i < n && j < m) {
    if (aKey[i] === bKey[j]) {
      ops.push({
        kind: "equal",
        text: a[i]!,
        leftNo,
        rightNo,
      });
      i += 1;
      j += 1;
      leftNo += 1;
      rightNo += 1;
    } else if ((dp[i + 1]![j] ?? 0) >= (dp[i]![j + 1] ?? 0)) {
      ops.push({ kind: "remove", text: a[i]!, leftNo });
      i += 1;
      leftNo += 1;
    } else {
      ops.push({ kind: "add", text: b[j]!, rightNo });
      j += 1;
      rightNo += 1;
    }
  }
  while (i < n) {
    ops.push({ kind: "remove", text: a[i]!, leftNo });
    i += 1;
    leftNo += 1;
  }
  while (j < m) {
    ops.push({ kind: "add", text: b[j]!, rightNo });
    j += 1;
    rightNo += 1;
  }

  if (!opts.wordLevel) return ops;

  // Pair adjacent remove→add into word spans for inline clarity
  const enriched: DiffOp[] = [];
  for (let k = 0; k < ops.length; k++) {
    const cur = ops[k]!;
    const next = ops[k + 1];
    if (cur.kind === "remove" && next?.kind === "add") {
      const words = diffWords(cur.text, next.text);
      enriched.push({ ...cur, words: words.filter((w) => w.kind !== "add") });
      enriched.push({ ...next, words: words.filter((w) => w.kind !== "remove") });
      k += 1;
    } else {
      enriched.push(cur);
    }
  }
  return enriched;
}

function summarize(ops: DiffOp[]) {
  let added = 0;
  let removed = 0;
  let same = 0;
  let charsAdded = 0;
  let charsRemoved = 0;
  for (const op of ops) {
    if (op.kind === "add") {
      added += 1;
      charsAdded += op.text.length;
    } else if (op.kind === "remove") {
      removed += 1;
      charsRemoved += op.text.length;
    } else {
      same += 1;
    }
  }
  const total = Math.max(1, added + removed + same);
  const similarity = Math.round((same / total) * 100);
  return { added, removed, same, charsAdded, charsRemoved, similarity };
}

function toRows(ops: DiffOp[], collapse: boolean, context = 2): DiffRow[] {
  if (!collapse) {
    return ops.map((op, index) => ({
      type: "op" as const,
      op,
      key: `op-${index}`,
    }));
  }

  const keep = new Set<number>();
  ops.forEach((op, index) => {
    if (op.kind === "equal") return;
    for (let i = Math.max(0, index - context); i <= Math.min(ops.length - 1, index + context); i++) {
      keep.add(i);
    }
  });

  if (keep.size === 0) {
    return ops.map((op, index) => ({
      type: "op" as const,
      op,
      key: `op-${index}`,
    }));
  }

  const rows: DiffRow[] = [];
  let skip = 0;
  ops.forEach((op, index) => {
    if (keep.has(index)) {
      if (skip > 0) {
        rows.push({ type: "skip", count: skip, key: `skip-${index}` });
        skip = 0;
      }
      rows.push({ type: "op", op, key: `op-${index}` });
    } else {
      skip += 1;
    }
  });
  if (skip > 0) {
    rows.push({ type: "skip", count: skip, key: "skip-end" });
  }
  return rows;
}

function WordLine({
  words,
  fallback,
  tone,
}: {
  words?: WordSpan[];
  fallback: string;
  tone: "add" | "remove" | "equal";
}) {
  if (!words?.length) {
    return <span className="min-w-0 flex-1 whitespace-pre-wrap">{fallback || " "}</span>;
  }
  return (
    <span className="min-w-0 flex-1 whitespace-pre-wrap">
      {words.map((word, index) => (
        <span
          key={`${index}-${word.text.slice(0, 8)}`}
          className={cn(
            word.kind !== "equal" &&
              tone === "add" &&
              "rounded-[3px] bg-[oklch(0.82_0.08_150)]/70 px-0.5 dark:bg-[oklch(0.42_0.08_150)]/70",
            word.kind !== "equal" &&
              tone === "remove" &&
              "rounded-[3px] bg-[oklch(0.82_0.08_30)]/70 px-0.5 line-through decoration-foreground/35 dark:bg-[oklch(0.42_0.08_30)]/70",
          )}
        >
          {word.text}
        </span>
      ))}
    </span>
  );
}

export function DiffWidget() {
  const reduceMotion = useReducedMotion();
  const [left, setLeft] = useState(SAMPLE_A);
  const [right, setRight] = useState(SAMPLE_B);
  const [mode, setMode] = useState<"side" | "inline">("inline");
  const [ignoreWs, setIgnoreWs] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [wordLevel, setWordLevel] = useState(true);
  const [collapse, setCollapse] = useState(true);
  const [copied, setCopied] = useState<"patch" | "stats" | null>(null);

  const ops = useMemo(
    () => diffLines(left, right, { ignoreWs, ignoreCase, wordLevel }),
    [left, right, ignoreWs, ignoreCase, wordLevel],
  );
  const stats = useMemo(() => summarize(ops), [ops]);
  const rows = useMemo(() => toRows(ops, collapse), [ops, collapse]);

  const patchText = useMemo(() => {
    const header = `--- before\n+++ after\n@@ +${stats.added} -${stats.removed} · ${stats.similarity}% alike @@`;
    const body = ops
      .map((op) => {
        if (op.kind === "equal") return `  ${op.text}`;
        if (op.kind === "add") return `+ ${op.text}`;
        return `- ${op.text}`;
      })
      .join("\n");
    return `${header}\n${body}`;
  }, [ops, stats]);

  const copy = async (kind: "patch" | "stats", value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1400);
    } catch {
      setCopied(null);
    }
  };

  return (
    <LabWidgetFrame
      icon={Diff}
      title="Text diff"
      subtitle="line LCS · word highlight · hunks"
      badge={`+${stats.added} −${stats.removed} · ${stats.similarity}%`}
      iconClassName="bg-[oklch(0.9_0.04_250)] text-[oklch(0.35_0.08_250)] dark:bg-[oklch(0.34_0.06_250)] dark:text-[oklch(0.9_0.04_240)]"
      preview={
        <div className="relative flex min-h-[380px] flex-1 flex-col">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "linear-gradient(135deg, color-mix(in oklch, var(--primary) 8%, transparent), transparent 42%), repeating-linear-gradient(0deg, transparent, transparent 23px, color-mix(in oklch, var(--foreground) 4%, transparent) 24px)",
            }}
          />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card/80 px-3 py-2 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <p className="font-mono text-[10px] tracking-[0.14em] text-foreground/45 uppercase">
                {mode === "side" ? "Side by side" : "Unified hunks"}
              </p>
              <SimilarityMeter value={stats.similarity} />
            </div>
            <div className="flex gap-1 rounded-md border border-border bg-background/80 p-0.5">
              {(
                [
                  ["inline", "Inline"],
                  ["side", "Side"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMode(id)}
                  className={cn(
                    "rounded-[5px] px-2.5 py-1 text-[11px] font-medium transition-colors",
                    mode === id
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {mode === "side" ? (
            <div className="relative z-10 grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
              <DiffPane
                label="Before"
                tone="remove"
                lines={ops.filter((op) => op.kind !== "add")}
                reduceMotion={!!reduceMotion}
              />
              <DiffPane
                label="After"
                tone="add"
                lines={ops.filter((op) => op.kind !== "remove")}
                reduceMotion={!!reduceMotion}
                className="border-t border-border lg:border-t-0 lg:border-l"
              />
            </div>
          ) : (
            <div className="relative z-10 min-h-0 flex-1 overflow-auto font-mono text-[12px] leading-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${stats.added}-${stats.removed}-${collapse}-${wordLevel}`}
                  initial={reduceMotion ? false : { opacity: 0.65 }}
                  animate={{ opacity: 1 }}
                  className="py-1"
                >
                  {ops.length === 0 ? (
                    <p className="px-3 py-10 text-center text-sm text-muted-foreground">
                      Both sides empty.
                    </p>
                  ) : (
                    rows.map((row) =>
                      row.type === "skip" ? (
                        <div
                          key={row.key}
                          className="my-1 flex items-center gap-2 px-3 py-1.5 text-[11px] text-foreground/45"
                        >
                          <span className="h-px flex-1 bg-border" />
                          <span className="font-mono tracking-wide uppercase">
                            {row.count} unchanged
                          </span>
                          <span className="h-px flex-1 bg-border" />
                        </div>
                      ) : (
                        <DiffLine
                          key={row.key}
                          op={row.op}
                          showWords={wordLevel}
                        />
                      ),
                    )
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </div>
      }
      controls={
        <div className="flex h-full flex-col gap-4">
          <div>
            <h3 className="font-display text-lg tracking-tight text-foreground">
              Compare
            </h3>
            <p className="mt-1 text-[13px] text-foreground/60">
              Line LCS with optional word highlight, whitespace/case ignores,
              and collapsed hunks.
            </p>
          </div>

          <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <FieldBlock
              label="Before"
              count={left.split("\n").filter((l, i, a) => !(i === a.length - 1 && l === "")).length}
            >
              <Textarea
                value={left}
                onChange={(event) => setLeft(event.target.value)}
                spellCheck={false}
                className="min-h-[120px] flex-1 resize-y rounded-xl border-rose-500/15 bg-[oklch(0.98_0.01_25)] font-mono text-[12px] leading-5 dark:bg-[oklch(0.24_0.02_25)]"
                placeholder="Original text…"
              />
            </FieldBlock>
            <FieldBlock
              label="After"
              count={right.split("\n").filter((l, i, a) => !(i === a.length - 1 && l === "")).length}
            >
              <Textarea
                value={right}
                onChange={(event) => setRight(event.target.value)}
                spellCheck={false}
                className="min-h-[120px] flex-1 resize-y rounded-xl border-emerald-500/15 bg-[oklch(0.98_0.01_150)] font-mono text-[12px] leading-5 dark:bg-[oklch(0.24_0.02_150)]"
                placeholder="Changed text…"
              />
            </FieldBlock>
          </div>

          <div className="grid gap-2 rounded-xl border border-border bg-background/70 p-3">
            <ToggleRow
              label="Ignore whitespace"
              checked={ignoreWs}
              onChange={setIgnoreWs}
            />
            <ToggleRow
              label="Ignore case"
              checked={ignoreCase}
              onChange={setIgnoreCase}
            />
            <ToggleRow
              label="Word-level highlight"
              checked={wordLevel}
              onChange={setWordLevel}
            />
            <ToggleRow
              label="Collapse unchanged"
              checked={collapse}
              onChange={setCollapse}
              icon={collapse ? EyeOff : Eye}
            />
          </div>

          <div className="rounded-xl border border-border bg-background/70 px-3 py-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] tracking-[0.14em] text-foreground/45 uppercase">
                  Delta
                </p>
                <p className="mt-1 font-display text-2xl tracking-tight text-foreground">
                  {stats.similarity}
                  <span className="ml-1 text-base text-foreground/45">%</span>
                </p>
              </div>
              <div className="text-right font-mono text-[11px] leading-5 text-muted-foreground">
                <p>
                  <span className="text-[oklch(0.45_0.12_150)] dark:text-[oklch(0.78_0.08_150)]">
                    +{stats.added}
                  </span>{" "}
                  /{" "}
                  <span className="text-[oklch(0.5_0.14_25)] dark:text-[oklch(0.78_0.08_30)]">
                    −{stats.removed}
                  </span>
                </p>
                <p>
                  +{stats.charsAdded} / −{stats.charsRemoved} chars
                </p>
                <p>{stats.same} unchanged lines</p>
              </div>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-[oklch(0.55_0.08_250)] dark:bg-[oklch(0.7_0.06_240)]"
                initial={false}
                animate={{ width: `${stats.similarity}%` }}
                transition={{ type: "spring", stiffness: 220, damping: 28 }}
              />
            </div>
          </div>

          <div className="mt-auto flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setLeft(SAMPLE_A);
                setRight(SAMPLE_B);
              }}
            >
              <RotateCcw data-icon="inline-start" />
              Sample
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setLeft(right);
                setRight(left);
              }}
            >
              <ArrowLeftRight data-icon="inline-start" />
              Swap
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setLeft("");
                setRight("");
              }}
            >
              <Eraser data-icon="inline-start" />
              Clear
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              onClick={() => void copy("patch", patchText)}
            >
              <AnimatePresence mode="wait" initial={false}>
                {copied === "patch" ? (
                  <motion.span
                    key="ok"
                    initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-1.5"
                  >
                    <Check className="size-3.5" />
                    Copied
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-1.5"
                  >
                    <Copy className="size-3.5" />
                    Copy patch
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>
      }
    />
  );
}

function SimilarityMeter({ value }: { value: number }) {
  return (
    <div
      className="hidden items-center gap-1.5 sm:flex"
      title={`${value}% similar`}
    >
      <div className="flex h-3 w-10 items-end gap-0.5">
        {[28, 48, 68, 88].map((threshold) => (
          <span
            key={threshold}
            className={cn(
              "w-1.5 rounded-[1px] transition-colors",
              value >= threshold
                ? "bg-[oklch(0.55_0.08_250)] dark:bg-[oklch(0.72_0.06_240)]"
                : "bg-border",
            )}
            style={{ height: `${threshold / 1.2}%` }}
          />
        ))}
      </div>
      <span className="font-mono text-[10px] text-foreground/50">{value}%</span>
    </div>
  );
}

function FieldBlock({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[120px] flex-col">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="text-[12px] font-medium text-foreground">{label}</label>
        <span className="font-mono text-[10px] text-foreground/40">
          {count} lines
        </span>
      </div>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  icon: Icon,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  icon?: typeof Eye;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-[12.5px] text-foreground/80">
      <span className="inline-flex items-center gap-1.5">
        {Icon ? <Icon className="size-3.5 text-foreground/40" /> : null}
        {label}
      </span>
      <Switch
        checked={checked}
        onCheckedChange={(next) => onChange(Boolean(next))}
        size="sm"
      />
    </label>
  );
}

function DiffLine({ op, showWords }: { op: DiffOp; showWords: boolean }) {
  return (
    <div
      className={cn(
        "grid grid-cols-[2.75rem_2.75rem_1rem_minmax(0,1fr)] gap-0 px-1 py-0.5",
        op.kind === "add" &&
          "bg-[oklch(0.94_0.04_150)] text-[oklch(0.32_0.08_150)] dark:bg-[oklch(0.28_0.04_150)] dark:text-[oklch(0.9_0.04_145)]",
        op.kind === "remove" &&
          "bg-[oklch(0.94_0.04_25)] text-[oklch(0.4_0.1_25)] dark:bg-[oklch(0.28_0.05_25)] dark:text-[oklch(0.92_0.04_40)]",
        op.kind === "equal" && "text-foreground/75",
      )}
    >
      <span className="select-none pr-2 text-right text-[10px] leading-6 text-foreground/35">
        {op.leftNo ?? ""}
      </span>
      <span className="select-none pr-2 text-right text-[10px] leading-6 text-foreground/35">
        {op.rightNo ?? ""}
      </span>
      <span className="select-none text-center opacity-70">
        {op.kind === "add" ? "+" : op.kind === "remove" ? "−" : " "}
      </span>
      <WordLine
        words={showWords ? op.words : undefined}
        fallback={op.text}
        tone={op.kind === "equal" ? "equal" : op.kind}
      />
    </div>
  );
}

function DiffPane({
  label,
  tone,
  lines,
  reduceMotion,
  className,
}: {
  label: string;
  tone: "add" | "remove";
  lines: DiffOp[];
  reduceMotion: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-0 flex-col bg-card/40", className)}>
      <p className="border-b border-border px-3 py-2 font-mono text-[10px] tracking-[0.14em] text-foreground/45 uppercase">
        {label}
      </p>
      <div className="min-h-0 flex-1 overflow-auto font-mono text-[12px] leading-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${label}-${lines.length}`}
            initial={reduceMotion ? false : { opacity: 0.7 }}
            animate={{ opacity: 1 }}
            className="py-1"
          >
            {lines.map((op, index) => {
              const changed = op.kind !== "equal";
              const no = tone === "add" ? op.rightNo : op.leftNo;
              return (
                <div
                  key={`${label}-${index}-${op.text.slice(0, 20)}`}
                  className={cn(
                    "grid grid-cols-[2.5rem_1rem_minmax(0,1fr)] px-1 py-0.5",
                    changed &&
                      tone === "add" &&
                      "bg-[oklch(0.94_0.04_150)] dark:bg-[oklch(0.28_0.04_150)]",
                    changed &&
                      tone === "remove" &&
                      "bg-[oklch(0.94_0.04_25)] dark:bg-[oklch(0.28_0.05_25)]",
                    !changed && "text-foreground/70",
                  )}
                >
                  <span className="select-none pr-2 text-right text-[10px] leading-6 text-foreground/35">
                    {no ?? ""}
                  </span>
                  <span className="select-none text-center opacity-50">
                    {changed ? (tone === "add" ? "+" : "−") : " "}
                  </span>
                  <WordLine
                    words={op.words}
                    fallback={op.text}
                    tone={changed ? tone : "equal"}
                  />
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
