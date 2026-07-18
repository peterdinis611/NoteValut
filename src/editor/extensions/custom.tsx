"use client";

import { Boxes, BookmarkPlus, FileUp, X } from "lucide-react";
import { useRef, useState } from "react";
import { blockToneStyle } from "@/lib/colors";
import { firstIssue, parseCustomBlock } from "@/lib/validation";
import { useToast } from "@/components/toast";
import { Extension } from "../create-extension";
import {
  saveCustomBlockTemplate,
  type CustomBlockTemplate,
} from "../custom-blocks";
import type { BlockRenderProps } from "../types";
import { BlockTextInput } from "../components/block-text-input";

const TEXT_EXTS = new Set([
  "txt",
  "md",
  "markdown",
  "json",
  "csv",
  "tsv",
  "log",
  "html",
  "htm",
  "css",
  "js",
  "jsx",
  "ts",
  "tsx",
  "py",
  "rb",
  "go",
  "rs",
  "java",
  "c",
  "cpp",
  "h",
  "yml",
  "yaml",
  "toml",
  "xml",
  "svg",
  "sql",
  "sh",
  "env",
]);

const MAX_BYTES = 200_000;

function CustomBlockView(props: BlockRenderProps) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const label = props.block.label || "";

  async function loadFile(file: File) {
    if (file.size > MAX_BYTES) {
      toast.error("File is too large (max 200 KB)");
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const looksText =
      TEXT_EXTS.has(ext) ||
      file.type.startsWith("text/") ||
      file.type === "application/json" ||
      file.type === "application/xml" ||
      file.type === "";

    if (!looksText) {
      toast.error("Upload a text file (.md, .txt, .json, …)");
      return;
    }

    try {
      const text = await file.text();
      const parsed = parseCustomBlock({
        label: props.block.label?.trim() || file.name.replace(/\.[^.]+$/, ""),
        body: text,
      });
      if (!parsed.success) {
        toast.error(firstIssue(parsed));
        return;
      }

      props.commands.updateBlock(props.block.id, {
        text: parsed.output.body,
        label: props.block.label?.trim() ? props.block.label : parsed.output.label,
      });
      setFileName(file.name);
      toast.success(`Loaded “${file.name}”`);
    } catch {
      toast.error("Couldn’t read that file");
    }
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void loadFile(file);
  }

  function clearFile() {
    setFileName(null);
    props.commands.updateBlock(props.block.id, { text: "" });
  }

  return (
    <div className="nv-custom" style={blockToneStyle(props.block.color, props.block.bgColor)}>
      <div className="nv-custom-head">
        <span className="nv-custom-badge">
          <Boxes className="size-3.5" strokeWidth={1.75} />
        </span>
        <div className="nv-custom-head-text">
          <span className="nv-custom-kicker">Custom block</span>
          {!props.readOnly && (
            <button
              type="button"
              className="nv-custom-save"
              title="Save to slash menu"
              onClick={() => {
                const parsed = parseCustomBlock({
                  label: props.block.label?.trim() || "",
                  body: props.block.text,
                });
                if (!parsed.success) {
                  toast.error(firstIssue(parsed));
                  return;
                }
                const template: CustomBlockTemplate = {
                  id: crypto.randomUUID(),
                  label: parsed.output.label,
                  description: "Saved custom block",
                  icon: "✦",
                  body: parsed.output.body,
                };
                saveCustomBlockTemplate(template);
                toast.success(`Saved “${template.label}” to slash menu`);
              }}
            >
              <BookmarkPlus className="size-3.5" />
              Save
            </button>
          )}
        </div>
      </div>

      <div className="nv-custom-fields">
        <label className="nv-custom-field">
          <span className="nv-custom-field-label">Name</span>
          <input
            className="nv-custom-name"
            value={label}
            readOnly={props.readOnly}
            placeholder="e.g. Meeting notes"
            onChange={(e) =>
              props.commands.updateBlock(props.block.id, { label: e.target.value })
            }
            onFocus={props.onFocus}
          />
        </label>

        <div className="nv-custom-field">
          <div className="nv-custom-content-head">
            <span className="nv-custom-field-label">Content</span>
            {!props.readOnly && (
              <div className="nv-custom-upload-actions">
                <button
                  type="button"
                  className="nv-custom-upload"
                  onClick={() => fileRef.current?.click()}
                >
                  <FileUp className="size-3.5" />
                  Upload file
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  className="sr-only"
                  accept=".txt,.md,.markdown,.json,.csv,.tsv,.log,.html,.htm,.css,.js,.jsx,.ts,.tsx,.py,.yml,.yaml,.toml,.xml,.svg,.sql,.sh,.env,text/*,application/json"
                  onChange={onFileInput}
                />
              </div>
            )}
          </div>

          {fileName && (
            <div className="nv-custom-file-chip">
              <span className="truncate">{fileName}</span>
              {!props.readOnly && (
                <button
                  type="button"
                  aria-label="Remove file content"
                  onClick={clearFile}
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          )}

          <div
            className={`nv-custom-drop ${dragging ? "nv-custom-drop-active" : ""}`}
            onDragEnter={(e) => {
              if (props.readOnly) return;
              e.preventDefault();
              setDragging(true);
            }}
            onDragOver={(e) => {
              if (props.readOnly) return;
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              if (props.readOnly) return;
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) void loadFile(file);
            }}
          >
            <BlockTextInput
              block={props.block}
              readOnly={props.readOnly}
              className="nv-input nv-custom-body"
              placeholder="Write the body, or drop / upload a text file…"
              rows={Math.max(3, props.block.text.split("\n").length)}
              onChange={props.onTextChange}
              onKeyDown={props.onKeyDown}
              onPaste={props.onPaste}
              onFocus={props.onFocus}
            />
            {dragging && (
              <div className="nv-custom-drop-hint">
                <FileUp className="size-4" />
                Drop file to load content
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const CustomBlock = Extension({
  name: "custom",
  types: ["custom"],
  slashCommands: [
    {
      id: "custom",
      type: "custom",
      label: "Custom block",
      description: "Name + content or upload a file",
      icon: "✦",
      keywords: ["custom", "own", "template", "block", "yours", "upload", "file"],
      group: "Yours",
    },
  ],
  render: (props) => <CustomBlockView {...props} />,
});
