import type { ReactNode } from "react";

export type SpinnerSize = "sm" | "md" | "lg";

const SIZE_CLASS: Record<SpinnerSize, string> = {
  sm: "nv-spinner-sm",
  md: "nv-spinner-md",
  lg: "nv-spinner-lg",
};

type SpinnerProps = {
  size?: SpinnerSize;
  label?: string;
  className?: string;
  /** Visually hide the label but keep it for screen readers */
  labelSrOnly?: boolean;
};

/**
 * Lightweight Phosphor spinner — safe in Server and Client Components.
 */
export function Spinner({
  size = "md",
  label = "Loading",
  className = "",
  labelSrOnly = true,
}: SpinnerProps) {
  return (
    <span
      className={`nv-spinner ${SIZE_CLASS[size]} ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <span className="nv-spinner-ring" aria-hidden />
      <span className={labelSrOnly ? "sr-only" : "nv-spinner-label"}>{label}</span>
    </span>
  );
}

type PreloadSpinnerProps = {
  label?: string;
  hint?: string;
  size?: SpinnerSize;
  className?: string;
  children?: ReactNode;
  /** Compact inset for panels / lists */
  compact?: boolean;
};

/**
 * Panel preload state — use as Suspense fallback or query-loading placeholder.
 * Safe in Server and Client Components.
 */
export function PreloadSpinner({
  label = "Loading…",
  hint,
  size = "md",
  className = "",
  children,
  compact = false,
}: PreloadSpinnerProps) {
  return (
    <div
      className={`nv-preload ${compact ? "nv-preload-compact" : ""} ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="nv-preload-glow" aria-hidden />
      <Spinner size={size} label={label} labelSrOnly={false} />
      {hint ? <p className="nv-preload-hint">{hint}</p> : null}
      {children}
    </div>
  );
}
