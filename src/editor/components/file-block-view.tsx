"use client";

import {
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  FileText,
  Presentation,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MediaUploadButton } from "@/components/media-upload-button";
import { useToast } from "@/components/toast";
import {
  OFFICE_ACCEPT,
  fileExtension,
  isOfficeFile,
  officeKindLabel,
  useVaultUpload,
} from "@/hooks/use-vault-upload";
import type { BlockRenderProps } from "../types";
import { OfficePreview } from "./office-preview";

function FileKindIcon({ name }: { name: string }) {
  const ext = fileExtension(name);
  if (ext === "xls" || ext === "xlsx") {
    return <FileSpreadsheet className="size-5" />;
  }
  if (ext === "ppt" || ext === "pptx") {
    return <Presentation className="size-5" />;
  }
  return <FileText className="size-5" />;
}

function canPreview(name: string) {
  const ext = fileExtension(name);
  return ["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext);
}

export function FileBlockView(props: BlockRenderProps) {
  const toast = useToast();
  const { uploadFile } = useVaultUpload();
  const rootRef = useRef<HTMLDivElement>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(props.block.text);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const url = props.block.url?.trim() ?? "";
  const name = props.block.text.trim() || "Untitled file";
  const kind = officeKindLabel(name);
  const previewable = Boolean(url && canPreview(name));

  useEffect(() => {
    setNameDraft(props.block.text);
  }, [props.block.text]);

  useEffect(() => {
    if (editingName) nameRef.current?.focus();
  }, [editingName]);

  function commitName() {
    const next = nameDraft.trim() || name;
    props.commands.updateBlock(props.block.id, { text: next });
    setEditingName(false);
  }

  async function attachFile(file: File) {
    if (!isOfficeFile(file)) {
      toast.error("Use Word, Excel, or PowerPoint files");
      return;
    }
    setUploading(true);
    try {
      const uploaded = await uploadFile(file);
      props.commands.updateBlock(props.block.id, {
        url: uploaded.url,
        text: file.name,
      });
      setPreviewOpen(true);
      toast.success(`Attached ${file.name}`);
    } catch {
      toast.error(`Couldn’t upload ${file.name}`);
    } finally {
      setUploading(false);
    }
  }

  if (!url) {
    return (
      <div
        className={`nv-file nv-file-empty-wrap ${dragging ? "nv-file-dropping" : ""}`}
        onFocus={props.onFocus}
        onDragEnter={(e) => {
          if (props.readOnly) return;
          if ([...e.dataTransfer.types].includes("Files")) {
            e.preventDefault();
            setDragging(true);
          }
        }}
        onDragOver={(e) => {
          if (props.readOnly) return;
          if ([...e.dataTransfer.types].includes("Files")) {
            e.preventDefault();
            setDragging(true);
          }
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          if (props.readOnly) return;
          const file = e.dataTransfer.files?.[0];
          if (!file) return;
          e.preventDefault();
          e.stopPropagation();
          setDragging(false);
          void attachFile(file);
        }}
      >
        <div className="nv-file-empty">
          <span className="nv-file-empty-icon">
            <FileText className="size-5" />
          </span>
          <div className="nv-file-empty-copy">
            <p className="nv-file-empty-title">
              {uploading ? "Uploading…" : "Attach Word, Excel, or PowerPoint"}
            </p>
            <p className="nv-file-empty-hint">
              Drop a file here, or upload .doc/.docx, .xls/.xlsx, .ppt/.pptx
            </p>
          </div>
          {!props.readOnly && (
            <MediaUploadButton
              accept={OFFICE_ACCEPT}
              label={uploading ? "Uploading…" : "Upload"}
              disabled={uploading}
              onUploaded={(uploadedUrl, file) => {
                props.commands.updateBlock(props.block.id, {
                  url: uploadedUrl,
                  text: file.name,
                });
                setPreviewOpen(true);
                toast.success(`Attached ${file.name}`);
              }}
              onError={(msg) => toast.error(msg)}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="nv-file" onFocus={props.onFocus}>
      <div className="nv-file-card">
        <span className={`nv-file-icon nv-file-icon-${kind.toLowerCase()}`}>
          <FileKindIcon name={name} />
        </span>
        <div className="nv-file-meta">
          {!props.readOnly && editingName ? (
            <input
              ref={nameRef}
              className="nv-file-name-input"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitName();
                }
                if (e.key === "Escape") {
                  setNameDraft(props.block.text);
                  setEditingName(false);
                }
              }}
            />
          ) : (
            <button
              type="button"
              className="nv-file-name"
              disabled={props.readOnly}
              onClick={() => {
                if (!props.readOnly) setEditingName(true);
              }}
              title={props.readOnly ? name : "Rename"}
            >
              {name}
            </button>
          )}
          <span className="nv-file-kind">{kind} document</span>
        </div>
        <div className="nv-file-actions">
          {previewable && (
            <button
              type="button"
              className={`nv-file-action ${previewOpen ? "nv-file-action-on" : ""}`}
              title={previewOpen ? "Hide preview" : "Show preview"}
              onClick={() => setPreviewOpen((v) => !v)}
            >
              <Eye className="size-3.5" />
              {previewOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              Preview
            </button>
          )}
          <a
            className="nv-file-action"
            href={url}
            download={name}
            target="_blank"
            rel="noopener noreferrer"
            title="Download"
          >
            <Download className="size-3.5" />
            Download
          </a>
          <a
            className="nv-file-action"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open"
          >
            <ExternalLink className="size-3.5" />
            Open
          </a>
          {!props.readOnly && (
            <>
              <MediaUploadButton
                accept={OFFICE_ACCEPT}
                label="Replace"
                onUploaded={(uploadedUrl, file) => {
                  props.commands.updateBlock(props.block.id, {
                    url: uploadedUrl,
                    text: file.name,
                  });
                  setPreviewOpen(true);
                  toast.success(`Replaced with ${file.name}`);
                }}
                onError={(msg) => toast.error(msg)}
              />
              <button
                type="button"
                className="nv-file-action nv-file-action-danger"
                title="Remove file"
                onClick={() =>
                  props.commands.updateBlock(props.block.id, {
                    url: undefined,
                    text: "",
                  })
                }
              >
                <Trash2 className="size-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
      {previewable && previewOpen && <OfficePreview url={url} name={name} />}
    </div>
  );
}
