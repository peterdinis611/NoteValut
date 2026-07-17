"use client";

import type { ClipboardEvent, KeyboardEvent } from "react";
import type { Block } from "@/lib/blocks";

type Props = {
  block: Block;
  readOnly?: boolean;
  className?: string;
  placeholder?: string;
  tag?: "input" | "textarea";
  rows?: number;
  spellCheck?: boolean;
  onChange: (text: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
  onPaste?: (e: ClipboardEvent<HTMLElement>) => void;
  onFocus: () => void;
};

export function BlockTextInput({
  block,
  readOnly,
  className = "",
  placeholder = "",
  tag = "textarea",
  rows = 1,
  spellCheck = true,
  onChange,
  onKeyDown,
  onPaste,
  onFocus,
}: Props) {
  const shared = {
    "data-block-id": block.id,
    value: block.text,
    readOnly,
    placeholder,
    className,
    spellCheck,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(e.target.value),
    onKeyDown: onKeyDown as (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void,
    onPaste: onPaste as ((e: ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void) | undefined,
    onFocus,
  };

  if (tag === "input") {
    return <input type="text" {...shared} />;
  }

  return <textarea {...shared} rows={rows} />;
}
