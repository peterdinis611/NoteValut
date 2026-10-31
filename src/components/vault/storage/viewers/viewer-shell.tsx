"use client";

import { LoaderCircle } from "lucide-react";
import { cn } from "cn";

export function ViewerLoading({ label = "Loading preview…" }: { label?: string }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-foreground/55">
      <LoaderCircle className="size-5 animate-spin" />
      <p className="font-mono text-[12px] tracking-wide uppercase">{label}</p>
    </div>
  );
}

export function ViewerError({ message }: { message: string }) {
  return (
    <div className="rounded-[12px] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {message}
    </div>
  );
}

export function ViewerFrame({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "max-h-[min(70vh,720px)] min-h-[220px] overflow-auto rounded-[14px] border border-border bg-background",
        className,
      )}
    >
      {children}
    </div>
  );
}
