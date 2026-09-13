"use client";

import katex from "katex";
import "katex/dist/katex.min.css";
import { useMemo } from "react";

export function PublishedMath({ latex }: { latex: string }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(latex || "\\;", {
        throwOnError: false,
        displayMode: true,
      });
    } catch {
      return "";
    }
  }, [latex]);

  if (!html) return <p className="published-math-error">Invalid LaTeX</p>;
  return (
    <div
      className="published-math"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
