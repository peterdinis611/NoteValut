"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Check,
  Copy,
  Download,
  FileCode2,
  Link2,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "cn";
import { LabWidgetFrame } from "./lab-widget-shell";

const SAMPLES = [
  {
    label: "Mark",
    value: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <!-- NoteValut mark sketch -->
  <rect x="12" y="12" width="96" height="96" rx="22" fill="#1c1712"/>
  <path d="M38 78 V42 L60 68 L82 42 V78"
        fill="none" stroke="#e8dcc8" stroke-width="8"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`,
  },
  {
    label: "Orb",
    value: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#c4a574"/>
      <stop offset="100%" stop-color="#1c1712"/>
    </linearGradient>
  </defs>
  <circle cx="32" cy="32" r="28" fill="url(#g)"/>
  <circle cx="32" cy="32" r="12" fill="none" stroke="#f5efe6" stroke-width="2"/>
</svg>
`,
  },
  {
    label: "Grid",
    value: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <g fill="none" stroke="#2a241c" stroke-width="1.5">
    <rect x="8" y="8" width="28" height="28" rx="4"/>
    <rect x="44" y="8" width="28" height="28" rx="4"/>
    <rect x="8" y="44" width="28" height="28" rx="4"/>
    <rect x="44" y="44" width="28" height="28" rx="4"/>
  </g>
</svg>
`,
  },
] as const;

type BgMode = "checker" | "paper" | "ink" | "brand";

function byteLength(value: string) {
  return new TextEncoder().encode(value).length;
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(n < 10_240 ? 2 : 1)} KB`;
}

function roundDecimals(value: string, places: number) {
  return value.replace(/-?\d*\.\d+/g, (match) => {
    const n = Number(match);
    if (!Number.isFinite(n)) return match;
    const rounded = Number(n.toFixed(places));
    return String(rounded);
  });
}

/** Strip scripts / handlers — preview-only sanitizer for pasted SVG. */
function sanitizeSvg(
  raw: string,
): { ok: true; svg: string } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: "Paste an SVG snippet." };
  if (!/<svg[\s>]/i.test(trimmed)) {
    return { ok: false, error: "Missing a root <svg> element." };
  }
  if (
    /<script[\s>]/i.test(trimmed) ||
    /javascript:/i.test(trimmed) ||
    /data:text\/html/i.test(trimmed)
  ) {
    return { ok: false, error: "Scripts and HTML data URLs are blocked." };
  }

  let svg = trimmed
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/xlink:href\s*=\s*("javascript:[^"]*"|'javascript:[^']*')/gi, "");

  if (!/xmlns\s*=/.test(svg)) {
    svg = svg.replace(
      /<svg\b/i,
      '<svg xmlns="http://www.w3.org/2000/svg"',
    );
  }

  return { ok: true, svg };
}

type OptimizeOptions = {
  stripComments: boolean;
  stripMetadata: boolean;
  collapseWs: boolean;
  round: boolean;
  stripIds: boolean;
  currentColor: boolean;
};

function optimizeSvg(svg: string, opts: OptimizeOptions) {
  let out = svg;

  if (opts.stripComments) {
    out = out.replace(/<!--[\s\S]*?-->/g, "");
  }
  if (opts.stripMetadata) {
    out = out
      .replace(/<metadata[\s\S]*?<\/metadata>/gi, "")
      .replace(/<title[\s\S]*?<\/title>/gi, "")
      .replace(/<desc[\s\S]*?<\/desc>/gi, "")
      .replace(/\s(?:inkscape|sodipodi|xmlns:(?:inkscape|sodipodi|svgjs)):[^\s=/]+(?:\s*=\s*("[^"]*"|'[^']*'))?/gi, "")
      .replace(/\s(?:data-[a-z0-9_-]+)\s*=\s*("[^"]*"|'[^']*')/gi, "");
  }
  if (opts.stripIds) {
    out = out.replace(/\sid\s*=\s*("[^"]*"|'[^']*')/gi, "");
  }
  if (opts.currentColor) {
    out = out
      .replace(/\s(?:fill|stroke)\s*=\s*("(?!none|url\()[^"]*"|'(?!none|url\()[^']*')/gi, (match) => {
        const quote = match.includes('"') ? '"' : "'";
        const attr = match.trimStart().startsWith("fill") ? "fill" : "stroke";
        return ` ${attr}=${quote}currentColor${quote}`;
      });
  }
  if (opts.round) {
    out = roundDecimals(out, 2);
  }
  if (opts.collapseWs) {
    out = out
      .replace(/\s{2,}/g, " ")
      .replace(/>\s+</g, "><")
      .replace(/\s*=\s*/g, "=")
      .replace(/\s+\/>/g, "/>")
      .replace(/\s+>/g, ">");
  }

  return out.trim();
}

function analyzeSvg(svg: string) {
  const tags = svg.match(/<[a-zA-Z][\w:-]*/g) ?? [];
  const elements = tags.length;
  const paths = (svg.match(/<path\b/gi) ?? []).length;
  const attrs = (svg.match(/\s[\w:-]+=/g) ?? []).length;
  const viewBox = svg.match(/\bviewBox\s*=\s*("([^"]*)"|'([^']*)')/i);
  const vb = viewBox?.[2] ?? viewBox?.[3] ?? null;
  const width = svg.match(/\bwidth\s*=\s*("([^"]*)"|'([^']*)')/i);
  const height = svg.match(/\bheight\s*=\s*("([^"]*)"|'([^']*)')/i);
  const hasDefs = /<defs[\s>]/i.test(svg);
  const hasGrad = /<(?:linear|radial)Gradient\b/i.test(svg);
  return {
    elements,
    paths,
    attrs,
    viewBox: vb,
    width: width?.[2] ?? width?.[3] ?? null,
    height: height?.[2] ?? height?.[3] ?? null,
    hasDefs,
    hasGrad,
  };
}

const BG: Record<BgMode, string> = {
  checker:
    "bg-[length:14px_14px] bg-[linear-gradient(45deg,#0000_25%,color-mix(in_oklch,var(--foreground)_7%,transparent)_25%,color-mix(in_oklch,var(--foreground)_7%,transparent)_50%,#0000_50%,#0000_75%,color-mix(in_oklch,var(--foreground)_7%,transparent)_75%)]",
  paper: "bg-[oklch(0.96_0.01_85)] dark:bg-[oklch(0.92_0.01_85)]",
  ink: "bg-[oklch(0.22_0.02_55)]",
  brand:
    "bg-[radial-gradient(ellipse_at_30%_20%,oklch(0.78_0.06_75),transparent_55%),oklch(0.93_0.02_85)] dark:bg-[radial-gradient(ellipse_at_30%_20%,oklch(0.4_0.05_70),transparent_55%),oklch(0.22_0.02_55)]",
};

export function SvgWidget() {
  const reduceMotion = useReducedMotion();
  const [source, setSource] = useState<string>(SAMPLES[0].value);
  const [bg, setBg] = useState<BgMode>("checker");
  const [scale, setScale] = useState(1);
  const [stripComments, setStripComments] = useState(true);
  const [stripMetadata, setStripMetadata] = useState(true);
  const [collapseWs, setCollapseWs] = useState(true);
  const [round, setRound] = useState(true);
  const [stripIds, setStripIds] = useState(false);
  const [currentColor, setCurrentColor] = useState(false);
  const [showOptSource, setShowOptSource] = useState(false);
  const [copied, setCopied] = useState<"opt" | "data" | null>(null);

  const parsed = useMemo(() => sanitizeSvg(source), [source]);
  const optimized = useMemo(() => {
    if (!parsed.ok) return "";
    const opts: OptimizeOptions = {
      stripComments,
      stripMetadata,
      collapseWs,
      round,
      stripIds,
      currentColor,
    };
    return optimizeSvg(parsed.svg, opts);
  }, [
    parsed,
    stripComments,
    stripMetadata,
    collapseWs,
    round,
    stripIds,
    currentColor,
  ]);
  const meta = useMemo(
    () => (parsed.ok ? analyzeSvg(optimized || parsed.svg) : null),
    [parsed, optimized],
  );

  const rawBytes = byteLength(source.trim());
  const optBytes = optimized ? byteLength(optimized) : 0;
  const saved = Math.max(0, rawBytes - optBytes);
  const savedPct = rawBytes > 0 ? Math.round((saved / rawBytes) * 100) : 0;

  const dataUrl = useMemo(() => {
    if (!parsed.ok || !optimized) return "";
    return `data:image/svg+xml;utf8,${encodeURIComponent(optimized)}`;
  }, [parsed, optimized]);

  const copy = async (kind: "opt" | "data", value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1400);
    } catch {
      setCopied(null);
    }
  };

  const download = (value: string, name: string) => {
    const blob = new Blob([value], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const previewHtml = useMemo(() => {
    if (!parsed.ok) return "";
    const markup = optimized || parsed.svg;
    if (!currentColor) return markup;
    // Wrap so currentColor resolves against foreground
    return `<div style="color:var(--foreground)">${markup}</div>`;
  }, [parsed, optimized, currentColor]);

  return (
    <LabWidgetFrame
      icon={FileCode2}
      title="SVG playground"
      subtitle="sanitize · analyze · optimize hint"
      badge={
        parsed.ok
          ? `${formatBytes(rawBytes)} → ${formatBytes(optBytes)}`
          : "invalid"
      }
      iconClassName="bg-[oklch(0.92_0.04_85)] text-[oklch(0.35_0.05_55)] dark:bg-[oklch(0.34_0.04_60)] dark:text-[oklch(0.9_0.03_80)]"
      preview={
        <div className="flex min-h-[380px] flex-1 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
            <div className="flex items-center gap-2">
              <p className="font-mono text-[10px] tracking-[0.14em] text-foreground/45 uppercase">
                Stage
              </p>
              {meta ? (
                <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-foreground/55">
                  {meta.elements} el · {meta.paths} path
                  {meta.viewBox ? ` · vb ${meta.viewBox}` : ""}
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  ["checker", "Check"],
                  ["paper", "Paper"],
                  ["ink", "Ink"],
                  ["brand", "Brand"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setBg(id)}
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
                    bg === id
                      ? "border-foreground/30 bg-foreground text-background"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div
            className={cn(
              "relative flex min-h-0 flex-1 items-center justify-center overflow-auto p-6",
              BG[bg],
              bg === "ink" && "text-[oklch(0.94_0.02_85)]",
            )}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-3 rounded-[14px] border border-dashed border-foreground/10"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute top-3 left-3 font-mono text-[9px] tracking-[0.16em] text-foreground/30 uppercase"
            >
              {Math.round(scale * 100)}%
            </div>

            {!parsed.ok ? (
              <p className="relative z-10 max-w-xs text-center text-sm text-muted-foreground">
                {parsed.error}
              </p>
            ) : showOptSource ? (
              <pre className="relative z-10 max-h-[280px] w-full max-w-xl overflow-auto rounded-xl border border-border bg-card/90 p-3 font-mono text-[11px] leading-5 text-foreground whitespace-pre-wrap">
                {optimized}
              </pre>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${optimized.slice(0, 48)}-${scale}-${currentColor}`}
                  initial={reduceMotion ? false : { opacity: 0.45, scale: 0.97 }}
                  animate={{ opacity: 1, scale }}
                  transition={{ type: "spring", stiffness: 260, damping: 26 }}
                  className="relative z-10 max-h-full max-w-full [&_svg]:h-auto [&_svg]:max-h-[260px] [&_svg]:w-auto [&_svg]:max-w-full"
                  style={{ transformOrigin: "center" }}
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </AnimatePresence>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2">
            <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="font-mono tracking-wide uppercase">Scale</span>
              <input
                type="range"
                min={0.5}
                max={2.5}
                step={0.1}
                value={scale}
                onChange={(event) => setScale(Number(event.target.value))}
                className="w-28 accent-[oklch(0.45_0.06_55)]"
              />
            </label>
            <button
              type="button"
              onClick={() => setShowOptSource((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11px] text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
            >
              {showOptSource ? (
                <Minimize2 className="size-3.5" />
              ) : (
                <Maximize2 className="size-3.5" />
              )}
              {showOptSource ? "Show art" : "Show optimized"}
            </button>
          </div>
        </div>
      }
      controls={
        <div className="flex h-full flex-col gap-4">
          <div>
            <h3 className="font-display text-lg tracking-tight text-foreground">
              Markup
            </h3>
            <p className="mt-1 text-[13px] text-foreground/60">
              Paste SVG, inspect structure, and run a lightweight optimize pass
              before you drop it into the vault.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {SAMPLES.map((sample) => (
              <button
                key={sample.label}
                type="button"
                onClick={() => setSource(sample.value)}
                className={cn(
                  "rounded-full border border-border px-3 py-1 text-[12px] text-foreground/70 transition-colors hover:bg-muted",
                  source === sample.value &&
                    "border-primary/40 bg-accent text-accent-foreground",
                )}
              >
                {sample.label}
              </button>
            ))}
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[12px] font-medium text-foreground">
                Source
              </label>
              <span className="font-mono text-[10px] text-foreground/40">
                {source.trim().length} chars
              </span>
            </div>
            <Textarea
              value={source}
              onChange={(event) => setSource(event.target.value)}
              spellCheck={false}
              className="min-h-[140px] flex-1 resize-y rounded-xl font-mono text-[11.5px] leading-5"
              placeholder="<svg …>"
            />
          </div>

          <div className="grid gap-2 rounded-xl border border-border bg-background/70 p-3">
            <p className="flex items-center gap-1.5 text-[12px] font-medium text-foreground">
              <Wand2 className="size-3.5 text-muted-foreground" />
              Optimize passes
            </p>
            <OptToggle
              label="Strip comments"
              checked={stripComments}
              onChange={setStripComments}
            />
            <OptToggle
              label="Strip metadata / data-*"
              checked={stripMetadata}
              onChange={setStripMetadata}
            />
            <OptToggle
              label="Collapse whitespace"
              checked={collapseWs}
              onChange={setCollapseWs}
            />
            <OptToggle
              label="Round decimals (2)"
              checked={round}
              onChange={setRound}
            />
            <OptToggle
              label="Strip id attributes"
              checked={stripIds}
              onChange={setStripIds}
            />
            <OptToggle
              label="Force currentColor fills"
              checked={currentColor}
              onChange={setCurrentColor}
            />
          </div>

          <div className="rounded-xl border border-border bg-background/70 px-3 py-3 text-[12px]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Sparkles className="size-3.5 text-muted-foreground" />
                Size hint
              </div>
              <span className="font-mono text-[11px] text-foreground/55">
                −{savedPct}%
              </span>
            </div>

            <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-[oklch(0.55_0.08_70)] dark:bg-[oklch(0.72_0.07_75)]"
                initial={false}
                animate={{
                  width: parsed.ok
                    ? `${Math.max(8, 100 - savedPct)}%`
                    : "0%",
                }}
                transition={{ type: "spring", stiffness: 200, damping: 28 }}
              />
            </div>

            <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 text-muted-foreground">
              <Stat label="Raw" value={formatBytes(rawBytes)} />
              <Stat
                label="Optimized"
                value={parsed.ok ? formatBytes(optBytes) : "—"}
              />
              <Stat
                label="Saved"
                value={
                  parsed.ok ? `${formatBytes(saved)} (${savedPct}%)` : "—"
                }
              />
              <Stat
                label="Attrs"
                value={meta ? String(meta.attrs) : "—"}
              />
            </dl>
            {meta ? (
              <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                {meta.width && meta.height
                  ? `${meta.width}×${meta.height}`
                  : "no fixed size"}
                {meta.hasDefs ? " · defs" : ""}
                {meta.hasGrad ? " · gradient" : ""}
                {" · "}
                not a full SVGO pass
              </p>
            ) : null}
          </div>

          <div className="mt-auto flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setSource(SAMPLES[0].value)}
            >
              <RotateCcw data-icon="inline-start" />
              Reset
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={!parsed.ok}
              onClick={() => parsed.ok && setSource(optimized)}
            >
              <Wand2 data-icon="inline-start" />
              Apply
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={!parsed.ok}
              onClick={() =>
                parsed.ok && download(optimized || parsed.svg, "mark.svg")
              }
            >
              <Download data-icon="inline-start" />
              .svg
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={!dataUrl}
              onClick={() => dataUrl && void copy("data", dataUrl)}
            >
              <Link2 data-icon="inline-start" />
              {copied === "data" ? "URL copied" : "Data URL"}
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              disabled={!parsed.ok}
              onClick={() =>
                parsed.ok && void copy("opt", optimized || parsed.svg)
              }
            >
              <AnimatePresence mode="wait" initial={false}>
                {copied === "opt" ? (
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
                    Copy optimized
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

function OptToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-[12.5px] text-foreground/80">
      {label}
      <Switch
        checked={checked}
        onCheckedChange={(next) => onChange(Boolean(next))}
        size="sm"
      />
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt>{label}</dt>
      <dd className="font-mono text-foreground">{value}</dd>
    </div>
  );
}
