"use client";

import type { ReactNode } from "react";

type Props = {
  label: string;
  children: ReactNode;
  side?: "top" | "bottom";
};

/** Lightweight hover tooltip for icon buttons. */
export function UiTooltip({ label, children, side = "bottom" }: Props) {
  return (
    <span className={`ui-tip ui-tip-${side}`} data-tip={label}>
      {children}
    </span>
  );
}
