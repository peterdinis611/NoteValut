"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { highlightCode } from "@/lib/highlight";
import type { BlockRenderProps } from "../types";
import { BlockTextInput } from "./block-text-input";
import { CodeLanguagePicker } from "./code-language-picker";

export function CodeBlockView(props: BlockRenderProps) {
  const { block, readOnly, commands, onTextChange, onKeyDown, onFocus, isFocused } = props;
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const language = block.language ?? "auto";
  const wrapRef = useRef<HTMLDivElement>(null);

  const preview = useMemo(
    () => highlightCode(block.text, language),
    [block.text, language],
  );

  const showPreview = readOnly || (!editing && !isFocused && !!block.text);

  useEffect(() => {
    if (!editing || showPreview) return;
    const el = wrapRef.current?.querySelector<HTMLTextAreaElement>("[data-block-id]");
    el?.focus();
  }, [editing, showPreview]);

  useEffect(() => {
    if (!isFocused) setEditing(false);
  }, [isFocused]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(block.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="nv-code-block" ref={wrapRef}>
      <div className="nv-code-toolbar">
        <CodeLanguagePicker
          value={language}
          disabled={readOnly}
          detected={language === "auto" && block.text ? preview.language : undefined}
          onFocus={onFocus}
          onChange={(next) => commands.updateBlock(block.id, { language: next })}
        />
        <span className="nv-code-toolbar-spacer" />
        <button type="button" className="nv-code-copy" onClick={copyCode} aria-label="Copy code">
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {showPreview ? (
        <button
          type="button"
          className="nv-code-pre-btn"
          onClick={() => {
            if (readOnly) return;
            setEditing(true);
            onFocus();
          }}
        >
          <pre className="nv-code-pre">
            <code
              className={`hljs language-${preview.language}`}
              dangerouslySetInnerHTML={{ __html: preview.html }}
            />
          </pre>
        </button>
      ) : (
        <BlockTextInput
          block={block}
          readOnly={readOnly}
          className="nv-input nv-code"
          placeholder="// Write code…"
          rows={Math.max(4, block.text.split("\n").length)}
          spellCheck={false}
          onChange={onTextChange}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setEditing(false);
              (e.target as HTMLTextAreaElement).blur();
              return;
            }
            onKeyDown(e);
          }}
          onFocus={() => {
            setEditing(true);
            onFocus();
          }}
        />
      )}
    </div>
  );
}
