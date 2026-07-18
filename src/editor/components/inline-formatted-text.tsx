"use client";

import { parseInlineSegments } from "@/lib/inline-format";

type Props = {
  text: string;
  className?: string;
  placeholder?: string;
};

export function InlineFormattedText({ text, className = "", placeholder }: Props) {
  if (!text) {
    return (
      <span className={`nv-inline-preview nv-inline-placeholder ${className}`}>
        {placeholder || ""}
      </span>
    );
  }

  const segments = parseInlineSegments(text);
  return (
    <span className={`nv-inline-preview ${className}`}>
      {segments.map((seg, i) => {
        if (seg.type === "text") return <span key={i}>{seg.value}</span>;
        if (seg.type === "bold") return <strong key={i}>{seg.value}</strong>;
        if (seg.type === "italic") return <em key={i}>{seg.value}</em>;
        if (seg.type === "code")
          return (
            <code key={i} className="nv-inline-code">
              {seg.value}
            </code>
          );
        return (
          <mark key={i} className="nv-inline-mark">
            {seg.value}
          </mark>
        );
      })}
    </span>
  );
}
