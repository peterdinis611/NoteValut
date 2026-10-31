"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRightLeft,
  Braces,
  Check,
  Copy,
  Minimize2,
  RotateCcw,
  Search,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "cn";
import {
  detectFormat,
  parseData,
  queryPath,
  serializeData,
  type DataFormat,
} from "./data-format-utils";
import { LabWidgetFrame } from "./lab-widget-shell";

const SAMPLE = `{
  "vault": "NoteValut",
  "meta": { "version": 1, "quiet": true },
  "pages": [
    { "id": "n1", "title": "Inbox", "tags": ["capture"] },
    { "id": "n2", "title": "Tasks", "tags": ["sprint", "lab"] }
  ]
}`;

const FORMAT_META: Record<
  DataFormat,
  { label: string; hint: string }
> = {
  json: { label: "JSON", hint: "objects · arrays" },
  yaml: { label: "YAML", hint: "indent maps" },
  csv: { label: "CSV", hint: "rows · headers" },
};

export function DataFormatWidget() {
  const reduceMotion = useReducedMotion();
  const [source, setSource] = useState(SAMPLE);
  const [inputFormat, setInputFormat] = useState<DataFormat>("json");
  const [outputFormat, setOutputFormat] = useState<DataFormat>("yaml");
  const [minify, setMinify] = useState(false);
  const [path, setPath] = useState("$.pages[0].title");
  const [copied, setCopied] = useState(false);

  const parsed = useMemo(() => {
    try {
      return { ok: true as const, value: parseData(source, inputFormat) };
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : "Parse failed",
      };
    }
  }, [source, inputFormat]);

  const queried = useMemo(() => {
    if (!parsed.ok) return parsed;
    try {
      return { ok: true as const, value: queryPath(parsed.value, path || "$") };
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : "Path failed",
      };
    }
  }, [parsed, path]);

  const output = useMemo(() => {
    if (!queried.ok) return "";
    try {
      return serializeData(queried.value, outputFormat, minify);
    } catch (error) {
      return error instanceof Error ? error.message : "Serialize failed";
    }
  }, [queried, outputFormat, minify]);

  const stats = useMemo(() => {
    const inBytes = new TextEncoder().encode(source.trim()).length;
    const outBytes = new TextEncoder().encode(output).length;
    return { inBytes, outBytes };
  }, [source, output]);

  const copyOut = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  const swap = () => {
    if (!queried.ok) return;
    setSource(output);
    setInputFormat(outputFormat);
    setOutputFormat(inputFormat);
    setPath("$");
  };

  return (
    <LabWidgetFrame
      icon={Braces}
      title="JSON ↔ YAML / CSV"
      subtitle="format · minify · $.path"
      badge={
        queried.ok
          ? `${stats.inBytes}→${stats.outBytes} B`
          : "error"
      }
      iconClassName="bg-[oklch(0.92_0.05_145)] text-[oklch(0.34_0.08_150)] dark:bg-[oklch(0.34_0.05_150)] dark:text-[oklch(0.9_0.04_145)]"
      preview={
        <div className="relative flex min-h-[380px] flex-1 flex-col">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 60% 50% at 100% 0%, color-mix(in oklch, var(--primary) 10%, transparent), transparent 60%)",
            }}
          />
          <div className="relative z-10 flex items-center justify-between gap-2 border-b border-border px-3 py-2">
            <p className="font-mono text-[10px] tracking-[0.14em] text-foreground/45 uppercase">
              Output · {FORMAT_META[outputFormat].label}
              {minify ? " · min" : ""}
            </p>
            <p className="font-mono text-[10px] text-foreground/40">
              {path.trim() || "$"}
            </p>
          </div>
          <div className="relative z-10 min-h-0 flex-1 overflow-auto">
            {!queried.ok ? (
              <div className="flex h-full items-center justify-center p-6">
                <p className="max-w-sm rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-center text-sm text-destructive">
                  {queried.error}
                </p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.pre
                  key={`${outputFormat}-${minify}-${output.slice(0, 48)}`}
                  initial={reduceMotion ? false : { opacity: 0.55 }}
                  animate={{ opacity: 1 }}
                  className="px-4 py-3 font-mono text-[12px] leading-6 whitespace-pre-wrap text-foreground"
                >
                  {output || "—"}
                </motion.pre>
              </AnimatePresence>
            )}
          </div>
        </div>
      }
      controls={
        <div className="flex h-full flex-col gap-4">
          <div>
            <h3 className="font-display text-lg tracking-tight text-foreground">
              Transform
            </h3>
            <p className="mt-1 text-[13px] text-foreground/60">
              Parse JSON, YAML, or CSV — query with{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                $.a.b
              </code>
              , then format or minify the result.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FormatPills
              value={inputFormat}
              onChange={setInputFormat}
              label="From"
            />
            <button
              type="button"
              onClick={swap}
              disabled={!queried.ok}
              className="rounded-md border border-border p-1.5 text-foreground/55 transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
              aria-label="Swap formats"
            >
              <ArrowRightLeft className="size-3.5" />
            </button>
            <FormatPills
              value={outputFormat}
              onChange={setOutputFormat}
              label="To"
            />
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label className="text-[12px] font-medium text-foreground">
                Source
              </label>
              <button
                type="button"
                className="font-mono text-[10px] text-foreground/45 underline-offset-2 hover:text-foreground hover:underline"
                onClick={() => setInputFormat(detectFormat(source))}
              >
                auto-detect
              </button>
            </div>
            <Textarea
              value={source}
              onChange={(event) => setSource(event.target.value)}
              spellCheck={false}
              className="min-h-[140px] flex-1 resize-y rounded-xl font-mono text-[11.5px] leading-5"
              placeholder='{ "ok": true }'
            />
          </div>

          <label className="block space-y-1.5">
            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-foreground">
              <Search className="size-3.5 text-muted-foreground" />
              Path query
            </span>
            <Input
              value={path}
              onChange={(event) => setPath(event.target.value)}
              spellCheck={false}
              className="rounded-xl font-mono text-[12.5px]"
              placeholder="$.pages[0].title"
            />
            <p className="text-[11px] text-muted-foreground">
              Supports <code className="font-mono">$</code>,{" "}
              <code className="font-mono">.key</code>,{" "}
              <code className="font-mono">[0]</code>,{" "}
              <code className="font-mono">[*]</code>
            </p>
          </label>

          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["$", "Root"],
                ["$.meta", "Meta"],
                ["$.pages[0]", "First page"],
                ["$.pages[*].title", "Titles"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setPath(value)}
                className={cn(
                  "rounded-full border border-border px-2.5 py-1 text-[11px] text-foreground/70 transition-colors hover:bg-muted",
                  path === value &&
                    "border-primary/40 bg-accent text-accent-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-auto flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setSource(SAMPLE);
                setInputFormat("json");
                setOutputFormat("yaml");
                setPath("$.pages[0].title");
                setMinify(false);
              }}
            >
              <RotateCcw data-icon="inline-start" />
              Sample
            </Button>
            <Button
              type="button"
              variant={minify ? "default" : "outline"}
              className="rounded-xl"
              onClick={() => setMinify((value) => !value)}
            >
              {minify ? (
                <Sparkles data-icon="inline-start" />
              ) : (
                <Minimize2 data-icon="inline-start" />
              )}
              {minify ? "Pretty" : "Minify"}
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              disabled={!queried.ok || !output}
              onClick={() => void copyOut()}
            >
              <AnimatePresence mode="wait" initial={false}>
                {copied ? (
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
                    Copy output
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

function FormatPills({
  value,
  onChange,
  label,
}: {
  value: DataFormat;
  onChange: (format: DataFormat) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-[10px] tracking-wide text-foreground/40 uppercase">
        {label}
      </span>
      <div className="flex gap-0.5 rounded-md border border-border p-0.5">
        {(Object.keys(FORMAT_META) as DataFormat[]).map((format) => (
          <button
            key={format}
            type="button"
            onClick={() => onChange(format)}
            className={cn(
              "rounded-[5px] px-2 py-1 text-[11px] font-medium transition-colors",
              value === format
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
            title={FORMAT_META[format].hint}
          >
            {FORMAT_META[format].label}
          </button>
        ))}
      </div>
    </div>
  );
}
