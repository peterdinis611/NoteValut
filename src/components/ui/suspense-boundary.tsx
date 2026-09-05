"use client";

import { Suspense, type ReactNode } from "react";
import { PreloadSpinner, type SpinnerSize } from "./spinner";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  label?: string;
  hint?: string;
  size?: SpinnerSize;
  compact?: boolean;
};

/**
 * Client Suspense wrapper with a Phosphor preload spinner fallback.
 */
export function SuspenseBoundary({
  children,
  fallback,
  label = "Loading…",
  hint,
  size = "md",
  compact = true,
}: Props) {
  return (
    <Suspense
      fallback={
        fallback ?? (
          <PreloadSpinner label={label} hint={hint} size={size} compact={compact} />
        )
      }
    >
      {children}
    </Suspense>
  );
}
