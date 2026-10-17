"use client";

import { type ReactNode, Suspense } from "react";
import { PreloadSpinner, type SpinnerSize } from "./spinner";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  label?: string;
  hint?: string;
  size?: SpinnerSize;
  compact?: boolean;
  /** Paper skeleton lines under the label */
  lines?: number;
};

/**
 * Client Suspense wrapper with a Folio preload spinner fallback.
 */
export function SuspenseBoundary({
  children,
  fallback,
  label = "Loading…",
  hint,
  size = "md",
  compact = true,
  lines = 3,
}: Props) {
  return (
    <Suspense
      fallback={
        fallback ?? (
          <PreloadSpinner
            label={label}
            hint={hint}
            size={size}
            compact={compact}
            lines={lines}
          />
        )
      }
    >
      {children}
    </Suspense>
  );
}
