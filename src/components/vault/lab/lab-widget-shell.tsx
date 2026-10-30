"use client";

import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "cn";

export function LabSection({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 space-y-4">
      <div className="max-w-2xl">
        <p className="font-mono text-[10px] tracking-[0.16em] text-foreground/50 uppercase">
          {eyebrow}
        </p>
        <h2 className="mt-1 font-display text-2xl tracking-tight text-foreground">
          {title}
        </h2>
        <p className="mt-1 text-[14px] text-foreground/60">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function LabWidgetFrame({
  icon: Icon,
  title,
  subtitle,
  badge,
  iconClassName,
  preview,
  controls,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  badge?: string;
  iconClassName?: string;
  preview: React.ReactNode;
  controls: React.ReactNode;
}) {
  return (
    <div className="grid overflow-hidden rounded-[18px] border border-border bg-card shadow-sm lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
      <div className="flex min-h-[300px] flex-col border-b border-border lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-muted text-foreground",
                iconClassName,
              )}
            >
              <Icon className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-foreground">
                {title}
              </p>
              <p className="truncate font-mono text-[10px] tracking-wide text-foreground/50">
                {subtitle}
              </p>
            </div>
          </div>
          {badge ? (
            <Badge
              variant="outline"
              className="shrink-0 rounded-full font-mono text-[10px]"
            >
              {badge}
            </Badge>
          ) : null}
        </div>
        <div className="relative flex min-h-0 flex-1 flex-col">{preview}</div>
      </div>
      <aside className="flex flex-col gap-4 bg-muted/20 p-4 md:p-5">
        {controls}
      </aside>
    </div>
  );
}
