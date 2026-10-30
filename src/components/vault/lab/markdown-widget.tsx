"use client";

import { Markdown } from "@tanstack/markdown/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Copy, FileCode2, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "cn";
import { LabWidgetFrame } from "./lab-widget-shell";

const SAMPLE = `# Shelf brief

A small **markdown** playground powered by TanStack Markdown.

## Checklist

- [x] Wire the lab page
- [ ] Paste into TipTap later
- [ ] Ship fixture dump

### Quote

> Quiet notes stay found.

\`\`\`ts
const note = { title: "Untitled", tags: ["lab"] }
\`\`\`

[TanStack Markdown](https://tanstack.com/markdown)
`;

const PRESETS = [
  { label: "Brief", value: SAMPLE },
  {
    label: "Tasks",
    value: `## Sprint tasks

1. Verify email flow
2. Soft-delete pages
3. Polish vault map

- Focus block at 10:00
- Design review _urgent_
`,
  },
  {
    label: "Empty",
    value: "",
  },
] as const;

export function MarkdownWidget() {
  const reduceMotion = useReducedMotion();
  const [source, setSource] = useState(SAMPLE);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <LabWidgetFrame
      icon={FileCode2}
      title="Markdown preview"
      subtitle="@tanstack/markdown"
      badge={`${source.length} chars`}
      iconClassName="bg-[oklch(0.9_0.05_150)] text-[oklch(0.32_0.08_150)] dark:bg-[oklch(0.34_0.06_150)] dark:text-[oklch(0.9_0.04_145)]"
      preview={
        <div className="grid min-h-[320px] flex-1 grid-rows-2 lg:grid-rows-1 lg:grid-cols-2">
          <div className="flex min-h-0 flex-col border-b border-border lg:border-r lg:border-b-0">
            <p className="border-b border-border px-3 py-2 font-mono text-[10px] tracking-[0.14em] text-foreground/45 uppercase">
              Source
            </p>
            <Textarea
              value={source}
              onChange={(event) => setSource(event.target.value)}
              spellCheck={false}
              className="min-h-0 flex-1 resize-none rounded-none border-0 bg-transparent px-4 py-3 font-mono text-[12.5px] leading-6 text-foreground shadow-none focus-visible:ring-0"
              placeholder="Write markdown…"
            />
          </div>
          <div className="flex min-h-0 flex-col overflow-hidden">
            <p className="border-b border-border px-3 py-2 font-mono text-[10px] tracking-[0.14em] text-foreground/45 uppercase">
              Preview
            </p>
            <div className="lab-md min-h-0 flex-1 overflow-auto px-4 py-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={source.slice(0, 48)}
                  initial={reduceMotion ? false : { opacity: 0.6 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {source.trim() ? (
                    <Markdown>{source}</Markdown>
                  ) : (
                    <p className="text-[13px] text-foreground/45">
                      Empty source — type on the left or load a preset.
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      }
      controls={
        <>
          <div>
            <h3 className="font-display text-lg tracking-tight text-foreground">
              Markdown controls
            </h3>
            <p className="mt-1 text-[13px] text-foreground/60">
              Edit source, see live TanStack Markdown output. Handy for TipTap
              paste checks and docs snippets.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setSource(preset.value)}
                className={cn(
                  "rounded-full border border-border px-3 py-1.5 text-[12px] text-foreground/70 transition-colors hover:bg-muted",
                  source === preset.value &&
                    "border-primary/40 bg-accent text-accent-foreground",
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="mt-auto flex flex-wrap gap-2 pt-1">
            <Button type="button" className="rounded-xl" onClick={() => void copy()}>
              {copied ? (
                <Check data-icon="inline-start" />
              ) : (
                <Copy data-icon="inline-start" />
              )}
              {copied ? "Copied" : "Copy markdown"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setSource(SAMPLE)}
            >
              <RotateCcw data-icon="inline-start" />
              Reset sample
            </Button>
          </div>
        </>
      }
    />
  );
}
