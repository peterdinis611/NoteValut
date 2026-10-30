"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ImageIcon, LoaderCircle, RefreshCw, Shuffle } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "cn";
import { LabWidgetFrame } from "./lab-widget-shell";
import { clampSize, randomSeed } from "./lab-utils";

const PRESETS = [
  { label: "Square", width: 640, height: 640 },
  { label: "Landscape", width: 960, height: 540 },
  { label: "Portrait", width: 480, height: 720 },
  { label: "Wide", width: 1200, height: 400 },
] as const;

function buildPicsumUrl(options: {
  width: number;
  height: number;
  seed: string;
  grayscale: boolean;
  blur: number;
}) {
  const w = clampSize(options.width);
  const h = clampSize(options.height);
  const params = new URLSearchParams();
  if (options.grayscale) params.set("grayscale", "");
  if (options.blur > 0) params.set("blur", String(options.blur));
  const query = params.toString().replace(/=(?=&|$)/g, "");
  return `https://picsum.photos/seed/${options.seed}/${w}/${h}${query ? `?${query}` : ""}`;
}

export function PicsumWidget() {
  const reduceMotion = useReducedMotion();
  const [width, setWidth] = useState(960);
  const [height, setHeight] = useState(540);
  const [seed, setSeed] = useState(() => randomSeed());
  const [grayscale, setGrayscale] = useState(false);
  const [blur, setBlur] = useState(0);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const imageUrl = useMemo(
    () =>
      buildPicsumUrl({
        width,
        height,
        seed,
        grayscale,
        blur,
      }),
    [blur, grayscale, height, seed, width],
  );

  const displayUrl = `${imageUrl}${imageUrl.includes("?") ? "&" : "?"}r=${revision}`;

  const bump = () => {
    setFailed(false);
    setLoading(true);
    setRevision((value) => value + 1);
  };

  const regenerate = () => {
    setSeed(randomSeed());
    bump();
  };

  return (
    <LabWidgetFrame
      icon={ImageIcon}
      title="Lorem Picsum"
      subtitle="Placeholder photography"
      badge={`${clampSize(width)}×${clampSize(height)}`}
      preview={
        <div className="relative flex flex-1 items-center justify-center bg-muted/30">
          <AnimatePresence mode="wait">
            {failed ? (
              <motion.div
                key="failed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-6 py-16 text-center"
              >
                <p className="font-display text-lg text-foreground">
                  Couldn’t load image
                </p>
                <p className="mt-1 text-[13px] text-foreground/55">
                  Check network, then try again.
                </p>
              </motion.div>
            ) : (
              <motion.img
                key={displayUrl}
                src={displayUrl}
                alt={`Picsum seed ${seed}`}
                initial={reduceMotion ? false : { opacity: 0, scale: 1.02 }}
                animate={{ opacity: loading ? 0.35 : 1, scale: 1 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="max-h-[min(40vh,400px)] w-full object-cover"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setFailed(true);
                }}
              />
            )}
          </AnimatePresence>
          {loading && !failed ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <LoaderCircle className="size-6 animate-spin text-foreground/45" />
            </div>
          ) : null}
          <p className="absolute right-3 bottom-3 rounded-full bg-background/80 px-2 py-1 font-mono text-[10px] text-foreground/70 backdrop-blur">
            seed · {seed}
          </p>
        </div>
      }
      controls={
        <>
          <div>
            <h3 className="font-display text-lg tracking-tight text-foreground">
              Image controls
            </h3>
            <p className="mt-1 text-[13px] text-foreground/60">
              Pick a size, seed, and filters — then shuffle a new frame.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => {
              const active =
                width === preset.width && height === preset.height;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setWidth(preset.width);
                    setHeight(preset.height);
                    bump();
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[12px] transition-colors",
                    active
                      ? "border-primary/40 bg-accent text-accent-foreground"
                      : "border-border text-foreground/70 hover:bg-muted",
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1.5">
              <span className="text-[11px] font-medium text-foreground/60">
                Width
              </span>
              <Input
                type="number"
                min={64}
                max={1600}
                value={width}
                onChange={(event) =>
                  setWidth(Number(event.target.value) || 64)
                }
                className="h-9 rounded-xl"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-[11px] font-medium text-foreground/60">
                Height
              </span>
              <Input
                type="number"
                min={64}
                max={1600}
                value={height}
                onChange={(event) =>
                  setHeight(Number(event.target.value) || 64)
                }
                className="h-9 rounded-xl"
              />
            </label>
          </div>

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
                Grayscale
              </p>
              <p className="text-[11px] text-foreground/50">
                Strip color from the frame
              </p>
            </div>
            <Switch
              checked={grayscale}
              onCheckedChange={(checked) => {
                setGrayscale(Boolean(checked));
                bump();
              }}
            />
          </div>

          <label className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-foreground/60">
                Blur
              </span>
              <span className="font-mono text-[11px] text-foreground/50">
                {blur}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              value={blur}
              onChange={(event) => {
                setBlur(Number(event.target.value));
                bump();
              }}
              className="w-full accent-[var(--primary)]"
            />
          </label>

          <div className="mt-auto flex flex-wrap gap-2 pt-1">
            <Button type="button" className="rounded-xl" onClick={regenerate}>
              <Shuffle data-icon="inline-start" />
              New image
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={bump}
            >
              <RefreshCw data-icon="inline-start" />
              Reload
            </Button>
          </div>
        </>
      }
    />
  );
}
