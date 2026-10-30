"use client";

import { motion, useReducedMotion } from "motion/react";

const skeletonRows = [88, 72, 64, 80, 56] as const;

export function VaultPreload({
  label = "Opening vault…",
}: {
  label?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative flex min-h-full flex-1 overflow-hidden bg-sidebar text-sidebar-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 55% 40% at 18% 12%, color-mix(in oklch, var(--sidebar-primary) 18%, transparent), transparent 60%), radial-gradient(ellipse 45% 35% at 88% 78%, color-mix(in oklch, var(--primary) 12%, transparent), transparent 65%)",
        }}
      />

      <aside className="relative z-10 hidden w-[240px] shrink-0 border-r border-sidebar-border bg-sidebar p-3 md:block">
        <div className="mb-4 flex items-center gap-2 px-1">
          <motion.span
            aria-hidden
            animate={
              reduceMotion
                ? undefined
                : { scale: [1, 1.05, 1], opacity: [0.85, 1, 0.85] }
            }
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="flex size-[18px] items-center justify-center rounded-[4px] bg-sidebar-primary text-[9px] font-semibold text-sidebar-primary-foreground"
          >
            N
          </motion.span>
          <div className="h-2.5 w-24 animate-pulse rounded bg-sidebar-accent" />
        </div>
        <div className="space-y-2 px-1">
          {skeletonRows.map((width, index) => (
            <motion.div
              key={width}
              initial={reduceMotion ? false : { opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * index, duration: 0.35 }}
              className="flex h-[28px] items-center gap-2 rounded-[6px] px-1"
            >
              <span className="size-3.5 rounded-[3px] bg-sidebar-accent" />
              <span
                className="h-2 rounded bg-sidebar-accent"
                style={{ width: `${width}%` }}
              />
            </motion.div>
          ))}
        </div>
      </aside>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col items-center justify-center bg-background px-6">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm text-center"
        >
          <motion.div
            aria-hidden
            className="mx-auto flex size-14 items-center justify-center rounded-[18px] bg-card shadow-[0_12px_40px_-18px_rgba(55,53,47,0.35)] ring-1 ring-border dark:shadow-[0_12px_40px_-18px_rgba(0,0,0,0.55)]"
            animate={
              reduceMotion
                ? undefined
                : { y: [0, -4, 0], rotate: [0, -2, 2, 0] }
            }
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="font-display text-lg font-semibold tracking-tight text-foreground">
              N
            </span>
          </motion.div>

          <p className="mt-5 font-display text-[22px] font-semibold tracking-tight text-foreground">
            NoteValut
          </p>
          <p className="mt-1.5 text-[14px] text-muted-foreground">{label}</p>

          <div className="mx-auto mt-7 h-1 w-40 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ x: "-100%", width: "40%" }}
              animate={
                reduceMotion ? { x: "30%" } : { x: ["-100%", "160%"] }
              }
              transition={{
                duration: 1.35,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>

          <p className="mt-4 font-mono text-[11px] tracking-wide text-muted-foreground/70">
            workspaces · folders · pages
          </p>
        </motion.div>
      </div>
    </div>
  );
}
