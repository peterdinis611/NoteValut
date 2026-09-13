"use client";

import { Check, Code2, Copy, Eye } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { highlightCode } from "@/lib/highlight";
import type { BlockRenderProps } from "../types";
import { BlockTextInput } from "./block-text-input";
import { CodeLanguagePicker } from "./code-language-picker";
import { MermaidPreview } from "./mermaid-preview";

export function CodeBlockView(props: BlockRenderProps) {
  const { block, readOnly, commands, onTextChange, onKeyDown, onFocus, isFocused } = props;
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const language = block.language ?? "auto";
  const isMermaid = language === "mermaid";
  const wrapRef = useRef<HTMLDivElement>(null);

  const preview = useMemo(() => {
    if (isMermaid) return { html: "", language: "mermaid" };
    return highlightCode(block.text, language);
  }, [block.text, language, isMermaid]);

  const showPreview = readOnly || (!editing && !isFocused && !!block.text);
  const showMermaidDiagram = isMermaid && (readOnly || !showSource) && (!editing || readOnly);

  useEffect(() => {
    if (!editing || showPreview) return;
    const el = wrapRef.current?.querySelector<HTMLTextAreaElement>("[data-block-id]");
    el?.focus();
  }, [editing, showPreview]);

  useEffect(() => {
    if (!isFocused) {
      setEditing(false);
      if (isMermaid) setShowSource(false);
    }
  }, [isFocused, isMermaid]);

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
    <div className={`nv-code-block ${isMermaid ? "nv-code-block-mermaid" : ""}`} ref={wrapRef}>
      <div className="nv-code-toolbar">
        <CodeLanguagePicker
          value={language}
          disabled={readOnly}
          detected={language === "auto" && block.text ? preview.language : undefined}
          onFocus={onFocus}
          onChange={(next) => {
            commands.updateBlock(block.id, { language: next });
            if (next === "mermaid") setShowSource(false);
          }}
        />
        <span className="nv-code-toolbar-spacer" />
        {isMermaid && !readOnly && (
          <button
            type="button"
            className={`nv-code-copy ${showSource ? "nv-code-mode-on" : ""}`}
            onClick={() => {
              setShowSource((v) => !v);
              setEditing(true);
              onFocus();
            }}
            aria-label={showSource ? "Show diagram" : "Edit source"}
            title={showSource ? "Show diagram" : "Edit source"}
          >
            {showSource ? <Eye className="size-3.5" /> : <Code2 className="size-3.5" />}
            {showSource ? "Preview" : "Source"}
          </button>
        )}
        <button type="button" className="nv-code-copy" onClick={copyCode} aria-label="Copy code">
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {showMermaidDiagram ? (
        <button
          type="button"
          className="nv-mermaid-btn"
          onClick={() => {
            if (readOnly) return;
            setShowSource(true);
            setEditing(true);
            onFocus();
          }}
          aria-label={readOnly ? "Mermaid diagram" : "Edit Mermaid diagram"}
        >
          <MermaidPreview source={block.text} />
        </button>
      ) : showPreview && !isMermaid ? (
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
          placeholder={
            isMermaid
              ? "flowchart TD\n  A[Start] --> B[End]"
              : "// Write code…"
          }
          rows={Math.max(isMermaid ? 6 : 4, block.text.split("\n").length)}
          spellCheck={false}
          onChange={onTextChange}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setEditing(false);
              if (isMermaid) setShowSource(false);
              (e.target as HTMLTextAreaElement).blur();
              return;
            }
            onKeyDown(e);
          }}
          onFocus={() => {
            setEditing(true);
            if (isMermaid) setShowSource(true);
            onFocus();
          }}
        />
      )}

      {isMermaid && showSource && !readOnly && editing && block.text.trim() && (
        <div className="nv-mermaid-live">
          <MermaidPreview source={block.text} />
        </div>
      )}
    </div>
  );
}
