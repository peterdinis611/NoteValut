"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ThemeToggle } from "@/components/theme/theme-switch";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="landing-shell relative flex min-h-full flex-1 flex-col bg-[oklch(0.94_0.02_65)] dark:bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.9_0.04_55/_0.7),transparent_55%)] dark:bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.35_0.05_65/_0.35),transparent_55%)]"
      />

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mx-3 my-3 flex flex-1 flex-col overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-[0_24px_80px_-40px_rgba(60,30,10,0.35)] md:mx-5 md:my-4 md:rounded-[2rem] dark:shadow-[0_24px_80px_-40px_rgba(0,0,0,0.65)]"
      >
        <div
          aria-hidden
          className="landing-paper pointer-events-none absolute inset-0 rounded-[inherit]"
        />

        <header className="relative z-10 mx-auto flex w-full max-w-md items-center justify-between px-6 pt-8">
          <Link
            href="/"
            className="font-display text-xl font-semibold tracking-tight text-foreground"
          >
            NoteValut
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link
              href="/"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Back
            </Link>
          </div>
        </header>

        <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.45 }}
            className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            {title}
          </motion.h1>
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, duration: 0.45 }}
            className="mt-2 text-base leading-relaxed text-muted-foreground"
          >
            {subtitle}
          </motion.p>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.45 }}
            className="mt-8"
          >
            {children}
          </motion.div>
        </main>
      </motion.div>
    </div>
  );
}
