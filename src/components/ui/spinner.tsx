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
 * Folio ink-seal spinner — safe in Server and Client Components.
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
      <span className="nv-spinner-seal" aria-hidden>
        <span className="nv-spinner-orbit" />
        <span className="nv-spinner-core" />
      </span>
      <span className={labelSrOnly ? "sr-only" : "nv-spinner-label"}>{label}</span>
    </span>
  );
}

type PreloadLinesProps = {
  count?: number;
  className?: string;
};

/** Soft paper skeleton lines under a preload label. */
export function PreloadLines({ count = 3, className = "" }: PreloadLinesProps) {
  const n = Math.max(1, Math.min(6, count));
  return (
    <div className={`nv-preload-lines ${className}`.trim()} aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <span
          key={i}
          className="nv-preload-line"
          style={{ width: `${92 - i * 14}%`, animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
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
  /** Show paper skeleton lines under the label */
  lines?: number;
};

/**
 * Panel preload state — Suspense fallback or query-loading placeholder.
 * Safe in Server and Client Components.
 */
export function PreloadSpinner({
  label = "Loading…",
  hint,
  size = "md",
  className = "",
  children,
  compact = false,
  lines = 0,
}: PreloadSpinnerProps) {
  return (
    <div
      className={`nv-preload ${compact ? "nv-preload-compact" : ""} ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="nv-preload-glow" aria-hidden />
      <div className="nv-preload-grain" aria-hidden />
      <Spinner size={size} label={label} labelSrOnly />
      <p className="nv-preload-label">{label}</p>
      {hint ? <p className="nv-preload-hint">{hint}</p> : null}
      {lines > 0 ? <PreloadLines count={lines} /> : null}
      {children}
    </div>
  );
}

type VaultPreloadProps = {
  title?: string;
  description?: string;
  compact?: boolean;
  className?: string;
};

/**
 * Full-page / gate preload — branded colophon while the vault boots.
 * Prefer this over heavy Lottie for routine loading.
 */
export function VaultPreload({
  title = "Opening your vault…",
  description = "Syncing notes and collections.",
  compact = false,
  className = "",
}: VaultPreloadProps) {
  return (
    <div
      className={`nv-vault-preload ${compact ? "nv-vault-preload-compact" : ""} ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="nv-vault-preload-card">
        <p className="nv-vault-preload-kicker">NoteVault</p>
        <div className="nv-vault-preload-mark" aria-hidden>
          <span className="nv-spinner-seal nv-spinner-lg">
            <span className="nv-spinner-orbit" />
            <span className="nv-spinner-core" />
          </span>
        </div>
        <h1 className="nv-vault-preload-title">{title}</h1>
        <p className="nv-vault-preload-desc">{description}</p>
        <PreloadLines count={compact ? 2 : 3} />
      </div>
    </div>
  );
}
