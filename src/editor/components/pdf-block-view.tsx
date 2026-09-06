"use client";

import { Expand, FileText, Link2, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MediaUploadButton } from "@/components/media-upload-button";
import { PdfViewer } from "@/components/pdf-viewer";
import { useToast } from "@/components/toast";
import { useVaultUpload } from "@/hooks/use-vault-upload";
import { easeOutSoft, overlayVariants } from "@/lib/motion";
import type { BlockRenderProps } from "../types";

export function PdfBlockView(props: BlockRenderProps) {
  const toast = useToast();
  const { uploadFile } = useVaultUpload();
  const [fullscreen, setFullscreen] = useState(false);
  const [editingUrl, setEditingUrl] = useState(false);
  const [urlDraft, setUrlDraft] = useState(props.block.url ?? "");
  const [mounted, setMounted] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);

  const url = props.block.url?.trim() ?? "";
  const title = props.block.text.trim() || props.block.label?.trim() || "PDF";

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    setUrlDraft(props.block.url ?? "");
  }, [props.block.url]);

  useEffect(() => {
    if (editingUrl) urlRef.current?.focus();
  }, [editingUrl]);

  useEffect(() => {
    if (!editingUrl) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node | null;
      if (!target || rootRef.current?.contains(target)) return;
      applyUrl(urlDraft);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setUrlDraft(url);
        setEditingUrl(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [editingUrl, urlDraft, url]);

  useEffect(() => {
    if (!fullscreen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setFullscreen(false);
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [fullscreen]);

  function applyUrl(next: string) {
    const trimmed = next.trim();
    props.commands.updateBlock(props.block.id, { url: trimmed || undefined });
    setEditingUrl(false);
  }

  async function attachPdfFile(file: File) {
    if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") {
      toast.error("Choose a PDF file");
      return;
    }
    setUploading(true);
    try {
      const uploaded = await uploadFile(file);
      props.commands.updateBlock(props.block.id, {
        url: uploaded.url,
        text: props.block.text.trim() || file.name.replace(/\.pdf$/i, ""),
      });
      props.onFocus();
      toast.success("PDF attached");
    } catch {
      toast.error("Couldn’t upload PDF");
    } finally {
      setUploading(false);
    }
  }

  if (!url) {
    return (
      <div
        className={`nv-pdf nv-pdf-empty-wrap ${dragging ? "nv-pdf-empty-dragging" : ""}`}
        onFocus={props.onFocus}
        onDragEnter={(e) => {
          if (props.readOnly) return;
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => {
          if (props.readOnly) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setDragging(false);
        }}
        onDrop={(e) => {
          if (props.readOnly) return;
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void attachPdfFile(file);
        }}
      >
        <div className="nv-pdf-empty">
          <span className="nv-pdf-empty-icon">
            <FileText className="size-5" />
          </span>
          <div className="nv-pdf-empty-copy">
            <p className="nv-pdf-empty-title">Embed a PDF</p>
            <p className="nv-pdf-empty-hint">
              {uploading ? "Uploading…" : "Upload, drop a .pdf here, or paste a direct link"}
            </p>
          </div>
        </div>
        {!props.readOnly && (
          <>
            <div className="nv-media-upload-row">
              <MediaUploadButton
                accept="application/pdf,.pdf"
                label="Upload PDF"
                disabled={uploading}
                onUploaded={(next, file) => {
                  props.commands.updateBlock(props.block.id, {
                    url: next,
                    text: props.block.text.trim() || file.name.replace(/\.pdf$/i, ""),
                  });
                  props.onFocus();
                }}
                onError={(msg) => toast.error(msg)}
              />
            </div>
            <div className="nv-pdf-url-bar">
              <Link2 className="size-3.5 shrink-0 opacity-50" />
              <input
                className="nv-pdf-url-inline"
                placeholder="https://…/document.pdf"
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                onFocus={props.onFocus}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyUrl(urlDraft);
                  }
                }}
                onBlur={() => {
                  if (urlDraft.trim()) applyUrl(urlDraft);
                }}
              />
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="nv-pdf" onFocus={props.onFocus}>
      {!props.readOnly && (
        <div className="nv-pdf-chrome">
          <input
            className="nv-pdf-title-input"
            placeholder="Document title"
            value={props.block.text}
            onChange={(e) => props.onTextChange(e.target.value)}
            onFocus={props.onFocus}
          />
          <div className="nv-pdf-chrome-actions">
            <button
              type="button"
              className={`nv-pdf-chrome-btn ${editingUrl ? "nv-pdf-chrome-btn-active" : ""}`}
              title="Replace link"
              aria-label="Replace link"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setEditingUrl((v) => !v)}
            >
              <Link2 className="size-3.5" />
            </button>
            <button
              type="button"
              className="nv-pdf-chrome-btn"
              title="Fullscreen"
              aria-label="Fullscreen"
              onClick={() => setFullscreen(true)}
            >
              <Expand className="size-3.5" />
            </button>
            <button
              type="button"
              className="nv-pdf-chrome-btn nv-pdf-chrome-btn-danger"
              title="Delete"
              aria-label="Delete PDF"
              onClick={() => props.commands.deleteBlock(props.block.id)}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {editingUrl && !props.readOnly && (
          <motion.div
            className="nv-pdf-url-bar"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            <Link2 className="size-3.5 shrink-0 opacity-50" />
            <input
              ref={urlRef}
              className="nv-pdf-url-inline"
              placeholder="https://…/document.pdf"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyUrl(urlDraft);
                }
                if (e.key === "Escape") {
                  setUrlDraft(url);
                  setEditingUrl(false);
                }
              }}
            />
            <button
              type="button"
              className="nv-pdf-url-apply"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyUrl(urlDraft)}
            >
              Save
            </button>
            <MediaUploadButton
              accept="application/pdf,.pdf"
              label="Replace"
              onUploaded={(next, file) => {
                props.commands.updateBlock(props.block.id, {
                  url: next,
                  text: props.block.text.trim() || file.name.replace(/\.pdf$/i, ""),
                });
                setEditingUrl(false);
              }}
              onError={(msg) => toast.error(msg)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <PdfViewer
        src={url}
        title={title}
        height="28rem"
        onToggleFullscreen={() => setFullscreen(true)}
      />

      {mounted &&
        createPortal(
          <AnimatePresence>
            {fullscreen && (
              <motion.div
                className="nv-pdf-overlay"
                role="dialog"
                aria-modal="true"
                aria-label={title}
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.18 }}
              >
                <button
                  type="button"
                  className="nv-pdf-overlay-backdrop"
                  aria-label="Close PDF viewer"
                  onClick={() => setFullscreen(false)}
                />
                <motion.div
                  className="nv-pdf-overlay-panel"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={easeOutSoft}
                >
                  <button
                    type="button"
                    className="nv-pdf-overlay-close"
                    aria-label="Close"
                    onClick={() => setFullscreen(false)}
                  >
                    <X className="size-4" />
                  </button>
                  <PdfViewer
                    src={url}
                    title={title}
                    fullscreen
                    onToggleFullscreen={() => setFullscreen(false)}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
