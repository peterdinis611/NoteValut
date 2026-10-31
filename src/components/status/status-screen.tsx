"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, Home, RefreshCw } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export function StatusScreen({
  code,
  title,
  description,
  primaryHref = "/",
  primaryLabel = "Back home",
  onRetry,
}: {
  code: "404" | "500";
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  onRetry?: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const accent = code === "404" ? "#e3944a" : "#c45c4a";

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="landing-paper pointer-events-none absolute inset-0 opacity-80"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(ellipse 50% 40% at 20% 15%, ${accent}22, transparent 65%), radial-gradient(ellipse 40% 35% at 85% 80%, oklch(0.88 0.04 230 / 0.18), transparent 68%)`,
        }}
      />

      <header className="relative z-10 flex items-center justify-between px-6 pt-6 md:px-10">
        <Link
          href="/"
          className="font-display text-lg font-semibold tracking-tight"
        >
          NoteValut
        </Link>
        <span className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          Status {code}
        </span>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col items-start justify-center px-6 py-16 md:px-10">
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-mono text-sm tracking-[0.18em] text-muted-foreground"
        >
          {code}
        </motion.p>

        <motion.h1
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mt-3 font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl"
        >
          {title}
        </motion.h1>

        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.45 }}
          className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground"
        >
          {description}
        </motion.p>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.45 }}
          className="mt-8 flex flex-wrap gap-2"
        >
          <Link
            href={primaryHref}
            className={cn(buttonVariants(), "h-10 rounded-xl px-4")}
          >
            <Home data-icon="inline-start" />
            {primaryLabel}
          </Link>

          {onRetry ? (
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-10 rounded-xl px-4",
              )}
              onClick={onRetry}
            >
              <RefreshCw data-icon="inline-start" />
              Try again
            </button>
          ) : (
            <Link
              href="/vault"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-10 rounded-xl px-4",
              )}
            >
              <ArrowLeft data-icon="inline-start" />
              Open vault
            </Link>
          )}
        </motion.div>

        <motion.div
          aria-hidden
          initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-14 w-full max-w-sm rounded-2xl border border-border bg-card/80 p-4 shadow-[0_20px_50px_-30px_rgba(40,20,10,0.4)] backdrop-blur-sm dark:shadow-[0_20px_50px_-30px_rgba(0,0,0,0.55)]"
        >
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <span
              className="size-2.5 rounded-full"
              style={{ background: accent }}
            />
            <span className="font-mono text-[11px] text-muted-foreground">
              shelf://lost-page
            </span>
          </div>
          <div className="mt-3 space-y-2">
            <div className="h-2.5 w-3/4 rounded bg-muted" />
            <div className="h-2.5 w-1/2 rounded bg-muted/80" />
            <div className="h-2.5 w-5/6 rounded bg-muted/60" />
          </div>
        </motion.div>
      </main>
    </div>
  );
}
