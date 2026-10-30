"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Copy, Shuffle, Type } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "cn";
import { LabWidgetFrame } from "./lab-widget-shell";
import { createRng, randomSeed } from "./lab-utils";

const WORDS = [
  "lorem",
  "ipsum",
  "dolor",
  "sit",
  "amet",
  "consectetur",
  "adipiscing",
  "elit",
  "sed",
  "do",
  "eiusmod",
  "tempor",
  "incididunt",
  "ut",
  "labore",
  "et",
  "dolore",
  "magna",
  "aliqua",
  "enim",
  "ad",
  "minim",
  "veniam",
  "quis",
  "nostrud",
  "exercitation",
  "ullamco",
  "laboris",
  "nisi",
  "aliquip",
  "ex",
  "ea",
  "commodo",
  "consequat",
  "duis",
  "aute",
  "irure",
  "in",
  "reprehenderit",
  "voluptate",
  "velit",
  "esse",
  "cillum",
  "fugiat",
  "nulla",
  "pariatur",
  "excepteur",
  "sint",
  "occaecat",
  "cupidatat",
  "non",
  "proident",
  "sunt",
  "culpa",
  "qui",
  "officia",
  "deserunt",
  "mollit",
  "anim",
  "id",
  "est",
  "laborum",
  "shelf",
  "vault",
  "note",
  "page",
  "folder",
  "ink",
  "paper",
] as const;

type TextMode = "paragraphs" | "sentences" | "words";

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function generateSentence(rng: () => number, minWords = 6, maxWords = 14) {
  const count = minWords + Math.floor(rng() * (maxWords - minWords + 1));
  const parts: string[] = [];
  for (let i = 0; i < count; i += 1) {
    parts.push(WORDS[Math.floor(rng() * WORDS.length)]!);
  }
  return `${capitalize(parts.join(" "))}.`;
}

function generateText(options: {
  mode: TextMode;
  count: number;
  seed: string;
  startWithLorem: boolean;
}) {
  const rng = createRng(options.seed);
  const count = Math.min(24, Math.max(1, Math.round(options.count)));

  if (options.mode === "words") {
    const words: string[] = [];
    for (let i = 0; i < count; i += 1) {
      words.push(WORDS[Math.floor(rng() * WORDS.length)]!);
    }
    if (options.startWithLorem && words.length >= 2) {
      words[0] = "Lorem";
      words[1] = "ipsum";
    }
    return words.join(" ");
  }

  if (options.mode === "sentences") {
    const sentences: string[] = [];
    for (let i = 0; i < count; i += 1) {
      if (i === 0 && options.startWithLorem) {
        sentences.push(
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        );
      } else {
        sentences.push(generateSentence(rng));
      }
    }
    return sentences.join(" ");
  }

  const paragraphs: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const sentenceCount = 3 + Math.floor(rng() * 3);
    const sentences: string[] = [];
    for (let s = 0; s < sentenceCount; s += 1) {
      if (i === 0 && s === 0 && options.startWithLorem) {
        sentences.push(
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        );
      } else {
        sentences.push(generateSentence(rng));
      }
    }
    paragraphs.push(sentences.join(" "));
  }
  return paragraphs.join("\n\n");
}

export function TextWidget() {
  const reduceMotion = useReducedMotion();
  const [mode, setMode] = useState<TextMode>("paragraphs");
  const [count, setCount] = useState(2);
  const [seed, setSeed] = useState(() => randomSeed());
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [copied, setCopied] = useState(false);

  const text = useMemo(
    () =>
      generateText({
        mode,
        count,
        seed,
        startWithLorem,
      }),
    [count, mode, seed, startWithLorem],
  );

  const stats = useMemo(() => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    return { words, chars: text.length };
  }, [text]);

  const regenerate = () => {
    setSeed(randomSeed());
    setCopied(false);
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <LabWidgetFrame
      icon={Type}
      title="Lorem text"
      subtitle="Placeholder copy"
      badge={`${stats.words} words`}
      iconClassName="bg-[oklch(0.9_0.05_240)] text-[oklch(0.35_0.08_250)] dark:bg-[oklch(0.34_0.06_250)] dark:text-[oklch(0.9_0.03_240)]"
      preview={
        <div className="relative flex-1 overflow-auto bg-[oklch(0.985_0.008_85)] px-5 py-5 dark:bg-[oklch(0.2_0.02_255)]">
          <AnimatePresence mode="wait">
            <motion.p
              key={seed + mode + count}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="whitespace-pre-wrap font-serif text-[15px] leading-7 text-foreground/85"
            >
              {text}
            </motion.p>
          </AnimatePresence>
        </div>
      }
      controls={
        <>
          <div>
            <h3 className="font-display text-lg tracking-tight text-foreground">
              Text controls
            </h3>
            <p className="mt-1 text-[13px] text-foreground/60">
              Paragraphs, sentences, or words for mock page content.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { value: "paragraphs", label: "Paragraphs" },
                { value: "sentences", label: "Sentences" },
                { value: "words", label: "Words" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMode(option.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[12px] transition-colors",
                  mode === option.value
                    ? "border-primary/40 bg-accent text-accent-foreground"
                    : "border-border text-foreground/70 hover:bg-muted",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <label className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-foreground/60">
                Count
              </span>
              <span className="font-mono text-[11px] text-foreground/50">
                {count}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={mode === "words" ? 48 : 8}
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
              className="w-full accent-[var(--primary)]"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-[11px] font-medium text-foreground/60">
              Seed
            </span>
            <Input
              value={seed}
              onChange={(event) => setSeed(event.target.value || randomSeed())}
              className="h-9 rounded-xl font-mono text-[13px]"
            />
          </label>

          <div className="flex items-center justify-between rounded-[12px] border border-border bg-background/60 px-3 py-2.5">
            <div>
              <p className="text-[13px] font-medium text-foreground">
                Start with Lorem
              </p>
              <p className="text-[11px] text-foreground/50">
                Classic opener sentence
              </p>
            </div>
            <Switch
              checked={startWithLorem}
              onCheckedChange={(checked) =>
                setStartWithLorem(Boolean(checked))
              }
            />
          </div>

          <div className="mt-auto flex flex-wrap gap-2 pt-1">
            <Button type="button" className="rounded-xl" onClick={regenerate}>
              <Shuffle data-icon="inline-start" />
              New text
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => void copyText()}
            >
              {copied ? (
                <Check data-icon="inline-start" />
              ) : (
                <Copy data-icon="inline-start" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          <p className="font-mono text-[10px] text-foreground/45">
            {stats.chars} chars · seed {seed}
          </p>
        </>
      }
    />
  );
}
