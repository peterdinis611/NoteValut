import { cn } from "@/lib/utils";

export function FloatingChip({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn(
        "landing-chip inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3.5 py-2 text-sm font-medium text-foreground shadow-[0_8px_24px_-8px_rgba(20,16,12,0.18)] dark:border-border dark:bg-card dark:text-card-foreground dark:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.55)]",
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}
