"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import type { Block } from "@/lib/blocks";
import { type InlineFormat, wrapSelection } from "@/lib/inline-format";
import { FormatToolbar } from "./format-toolbar";
import { InlineFormattedText } from "./inline-formatted-text";

type Props = {
  block: Block;
  readOnly?: boolean;
  className?: string;
  placeholder?: string;
  tag?: "input" | "textarea";
  rows?: number;
  spellCheck?: boolean;
  richPreview?: boolean;
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
  richPreview = true,
  onChange,
  onKeyDown,
  onPaste,
  onFocus,
}: Props) {
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const pendingSelection = useRef<{ start: number; end: number } | null>(null);

  useEffect(() => {
    if (!pendingSelection.current || !ref.current) return;
    const { start, end } = pendingSelection.current;
    pendingSelection.current = null;
    ref.current.focus();
    ref.current.setSelectionRange(start, end);
  }, [block.text]);

  const applyFormat = useCallback(
    (format: InlineFormat) => {
      const el = ref.current;
      if (!el || readOnly) return;
      const start = el.selectionStart ?? 0;
      const end = el.selectionEnd ?? 0;
      const next = wrapSelection(block.text, start, end, format);
      pendingSelection.current = {
        start: next.selectionStart,
        end: next.selectionEnd,
      };
      onChange(next.text);
      setShowToolbar(next.selectionEnd > next.selectionStart);
    },
    [block.text, onChange, readOnly],
  );

  function syncToolbar() {
    const el = ref.current;
    if (!el || readOnly) {
      setShowToolbar(false);
      return;
    }
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    setShowToolbar(focused && end > start);
  }

  function handleKeyDownLocal(e: KeyboardEvent<HTMLElement>) {
    const meta = e.metaKey || e.ctrlKey;
    if (meta && !e.altKey) {
      const key = e.key.toLowerCase();
      if (key === "b") {
        e.preventDefault();
        applyFormat("bold");
        return;
      }
      if (key === "i") {
        e.preventDefault();
        applyFormat("italic");
        return;
      }
      if (key === "e") {
        e.preventDefault();
        applyFormat("code");
        return;
      }
      if (key === "h" && e.shiftKey) {
        e.preventDefault();
        applyFormat("highlight");
        return;
      }
    }
    onKeyDown(e);
  }

  const usePreview = richPreview && (readOnly || !focused);

  const fieldProps = {
    ref: ref as React.RefObject<HTMLTextAreaElement & HTMLInputElement>,
    "data-block-id": block.id,
    value: block.text,
    readOnly,
    placeholder,
    className: `${className}${usePreview ? " nv-input-ghost" : ""}`,
    spellCheck,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(e.target.value),
    onKeyDown: handleKeyDownLocal as (
      e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => void,
    onPaste: onPaste as
      | ((e: ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void)
      | undefined,
    onFocus: () => {
      setFocused(true);
      onFocus();
      syncToolbar();
    },
    onBlur: () => {
      setFocused(false);
      setShowToolbar(false);
    },
    onSelect: syncToolbar,
    onMouseUp: syncToolbar,
    onKeyUp: syncToolbar,
  };

  return (
    <div className="nv-input-wrap">
      {showToolbar && !readOnly && <FormatToolbar onFormat={applyFormat} />}
      {usePreview && (
        <div
          className={`nv-input-preview ${className}`}
          onMouseDown={(e) => {
            if (readOnly) return;
            e.preventDefault();
            setFocused(true);
            onFocus();
            requestAnimationFrame(() => {
              const el = ref.current;
              if (!el) return;
              el.focus();
              const len = block.text.length;
              el.setSelectionRange(len, len);
            });
          }}
        >
          <InlineFormattedText text={block.text} placeholder={placeholder} />
        </div>
      )}
      {tag === "input" ? (
        <input type="text" {...fieldProps} />
      ) : (
        <textarea {...fieldProps} rows={rows} />
      )}
    </div>
  );
}
