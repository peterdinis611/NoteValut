"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { Calculator, RefreshCw } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { useOwnerId } from "@/hooks/use-owner-id";
import { evaluateMath, normalizeComputeExpr } from "@/lib/math-engine";
import { Extension } from "../create-extension";
import { BlockTextInput } from "../components/block-text-input";
import type { BlockRenderProps } from "../types";

type MathMode = "latex" | "compute";

function mathMode(language: string | undefined): MathMode {
  return language === "compute" ? "compute" : "latex";
}

function MathPreview({ latex }: { latex: string }) {
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

  if (!html) return <p className="nv-math-error">Invalid LaTeX</p>;
  return <div className="nv-math-preview" dangerouslySetInnerHTML={{ __html: html }} />;
}

function ComputeResult({ expression }: { expression: string }) {
  const result = useMemo(
    () => evaluateMath(normalizeComputeExpr(expression)),
    [expression],
  );

  if (!expression.trim()) {
    return <p className="nv-math-hint">Enter an expression — e.g. sqrt(2) + 3^2</p>;
  }

  if (!result.ok) {
    return <p className="nv-math-error">{result.error}</p>;
  }

  return (
    <div className="nv-math-result" aria-live="polite">
      <span className="nv-math-result-eq" aria-hidden>
        =
      </span>
      <code className="nv-math-result-value">{result.display}</code>
    </div>
  );
}

function MathBlockView(props: BlockRenderProps) {
  const mode = mathMode(props.block.language);
  const [editing, setEditing] = useState(!props.block.text.trim());

  const setMode = (next: MathMode) => {
    props.commands.updateBlock(props.block.id, { language: next });
  };

  return (
    <div className={`nv-math ${mode === "compute" ? "nv-math-compute" : ""}`}>
      {!props.readOnly && (
        <div className="nv-math-toolbar">
          <button
            type="button"
            className={`nv-math-tab ${mode === "latex" ? "active" : ""}`}
            onClick={() => setMode("latex")}
          >
            LaTeX
          </button>
          <button
            type="button"
            className={`nv-math-tab ${mode === "compute" ? "active" : ""}`}
            onClick={() => setMode("compute")}
            title="Evaluate with math.js"
          >
            <Calculator className="size-3" />
            Compute
          </button>
          <span className="nv-math-toolbar-sep" aria-hidden />
          <button
            type="button"
            className={`nv-math-tab ${editing ? "active" : ""}`}
            onClick={() => setEditing(true)}
          >
            Source
          </button>
          <button
            type="button"
            className={`nv-math-tab ${!editing ? "active" : ""}`}
            onClick={() => setEditing(false)}
          >
            {mode === "compute" ? "Result" : "Preview"}
          </button>
        </div>
      )}
      {editing && !props.readOnly ? (
        <>
          <BlockTextInput
            block={props.block}
            readOnly={props.readOnly}
            className="nv-input nv-math-input"
            placeholder={
              mode === "compute"
                ? "math.js… e.g. derivative('x^2', 'x') or 2 inch to cm"
                : "LaTeX… e.g. \\frac{a}{b}"
            }
            onChange={props.onTextChange}
            onKeyDown={props.onKeyDown}
            onPaste={props.onPaste}
            onFocus={props.onFocus}
          />
          {mode === "compute" && props.block.text.trim() ? (
            <ComputeResult expression={props.block.text} />
          ) : null}
        </>
      ) : (
        <button
          type="button"
          className="nv-math-preview-btn"
          onClick={() => !props.readOnly && setEditing(true)}
          onFocus={props.onFocus}
        >
          {mode === "compute" ? (
            <ComputeResult expression={props.block.text} />
          ) : (
            <MathPreview latex={props.block.text} />
          )}
        </button>
      )}
    </div>
  );
}

export const MathBlock = Extension({
  name: "math",
  types: ["math"],
  slashCommands: [
    {
      id: "math",
      type: "math",
      label: "Math (KaTeX)",
      description: "LaTeX equation",
      icon: "∑",
      keywords: ["math", "latex", "katex", "equation", "formula"],
      group: "Media",
      language: "latex",
      seedText: "E = mc^2",
    },
    {
      id: "math-compute",
      type: "math",
      label: "Calculate (math.js)",
      description: "Evaluate expressions, units, derivatives",
      icon: "🔢",
      keywords: ["math", "calc", "compute", "mathjs", "calculate", "formula"],
      group: "Media",
      language: "compute",
      seedText: "sqrt(2) + 3^2",
    },
  ],
  render: (props) => <MathBlockView {...props} />,
});

function SyncedBlockView(props: BlockRenderProps) {
  const ownerId = useOwnerId() ?? "";
  const key = props.block.syncedId || props.block.id;
  const remote = useQuery(
    api.syncedBlocks.getByKey,
    ownerId && key ? { ownerId, key } : "skip",
  );
  const upsert = useMutation(api.syncedBlocks.upsert);
  const [local, setLocal] = useState(props.block.text);

  useEffect(() => {
    if (remote?.text !== undefined && remote.text !== local) {
      setLocal(remote.text);
      if (remote.text !== props.block.text) {
        props.commands.updateBlock(props.block.id, { text: remote.text, syncedId: key });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remote?.text, remote?.updatedAt]);

  useEffect(() => {
    if (!props.block.syncedId) {
      props.commands.updateBlock(props.block.id, { syncedId: key });
    }
  }, [key, props.block.id, props.block.syncedId, props.commands]);

  const onChange = (text: string) => {
    setLocal(text);
    props.onTextChange(text);
    if (ownerId) {
      void upsert({
        ownerId,
        key,
        text,
        label: props.block.label ?? "Synced block",
      });
    }
  };

  return (
    <div className="nv-synced">
      <div className="nv-synced-badge">
        <RefreshCw className="size-3" />
        <span>{props.block.label || "Synced"}</span>
      </div>
      <BlockTextInput
        block={{ ...props.block, text: local }}
        readOnly={props.readOnly}
        className="nv-input nv-synced-input"
        placeholder="Shared content — edits update every instance…"
        onChange={onChange}
        onKeyDown={props.onKeyDown}
        onPaste={props.onPaste}
        onFocus={props.onFocus}
      />
    </div>
  );
}

export const SyncedBlock = Extension({
  name: "synced",
  types: ["synced"],
  slashCommands: [
    {
      id: "synced",
      type: "synced",
      label: "Synced block",
      description: "Same content on multiple pages",
      icon: "↺",
      keywords: ["synced", "transclusion", "embed", "live"],
      group: "Media",
    },
  ],
  render: (props) => <SyncedBlockView {...props} />,
});
