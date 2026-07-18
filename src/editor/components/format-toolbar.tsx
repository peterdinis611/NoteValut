"use client";

import { Bold, Code2, Highlighter, Italic } from "lucide-react";
import type { InlineFormat } from "@/lib/inline-format";

type Props = {
  onFormat: (format: InlineFormat) => void;
};

const ACTIONS: { format: InlineFormat; label: string; icon: typeof Bold; hint: string }[] = [
  { format: "bold", label: "Bold", icon: Bold, hint: "⌘B" },
  { format: "italic", label: "Italic", icon: Italic, hint: "⌘I" },
  { format: "code", label: "Code", icon: Code2, hint: "⌘E" },
  { format: "highlight", label: "Highlight", icon: Highlighter, hint: "⌘⇧H" },
];

export function FormatToolbar({ onFormat }: Props) {
  return (
    <div className="nv-format-toolbar" role="toolbar" aria-label="Text formatting">
      {ACTIONS.map((action) => (
        <button
          key={action.format}
          type="button"
          className="nv-format-btn"
          title={`${action.label} (${action.hint})`}
          aria-label={action.label}
          onMouseDown={(e) => {
            e.preventDefault();
            onFormat(action.format);
          }}
        >
          <action.icon className="size-3.5" />
        </button>
      ))}
    </div>
  );
}
