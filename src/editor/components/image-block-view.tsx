"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Captions,
  Download,
  Expand,
  ImageIcon,
  Link2,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { ImageViewer } from "@/components/image-viewer";
import { MediaUploadButton } from "@/components/media-upload-button";
import { useToast } from "@/components/toast";
import { easeOutSoft, dropdownVariants } from "@/lib/motion";
import type { BlockRenderProps } from "../types";

const MIN_WIDTH = 25;
const MAX_WIDTH = 100;

export function ImageBlockView(props: BlockRenderProps) {
  const toast = useToast();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selected, setSelected] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [editingUrl, setEditingUrl] = useState(false);
  const [editingCaption, setEditingCaption] = useState(false);
  const [urlDraft, setUrlDraft] = useState(props.block.url ?? "");
  const [broken, setBroken] = useState(false);
  const [dragWidth, setDragWidth] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);

  const url = props.block.url?.trim() ?? "";
  const caption = props.block.text;
  const alt = caption.trim() || "Image";
  const width = clampWidth(dragWidth ?? props.block.width ?? 100);
  const align = props.block.align ?? "center";
  const showChrome =
    !props.readOnly && (selected || hovered || editingUrl || editingCaption);

  useEffect(() => {
    setUrlDraft(props.block.url ?? "");
    setBroken(false);
  }, [props.block.url]);

  useEffect(() => {
    if (editingCaption) captionRef.current?.focus();
  }, [editingCaption]);

  useEffect(() => {
    if (editingUrl) urlRef.current?.focus();
  }, [editingUrl]);

  useEffect(() => {
    if (!selected && !editingUrl && !editingCaption) return;

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node | null;
      if (!target || rootRef.current?.contains(target)) return;
      dismiss();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [selected, editingUrl, editingCaption, urlDraft, url]);

  function dismiss() {
    if (editingUrl) {
      const trimmed = urlDraft.trim();
      if (trimmed && trimmed !== url) {
        props.commands.updateBlock(props.block.id, { url: trimmed });
      } else {
        setUrlDraft(url);
      }
    }
    setEditingUrl(false);
    setEditingCaption(false);
    setSelected(false);
    setHovered(false);
  }

  function applyUrl(next: string) {
    const trimmed = next.trim();
    props.commands.updateBlock(props.block.id, { url: trimmed || undefined });
    setEditingUrl(false);
    setBroken(false);
  }

  function setAlign(next: "left" | "center" | "right") {
    props.commands.updateBlock(props.block.id, { align: next });
  }

  function commitWidth(next: number) {
    props.commands.updateBlock(props.block.id, { width: clampWidth(next) });
    setDragWidth(null);
  }

  function startResize(edge: "left" | "right", e: ReactPointerEvent) {
    if (props.readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    setSelected(true);
    const parent = wrapRef.current?.parentElement;
    if (!parent) return;
    const parentWidth = parent.getBoundingClientRect().width;
    const startX = e.clientX;
    const startWidth = width;

    function onMove(ev: PointerEvent) {
      const dx = ev.clientX - startX;
      const deltaPct = (dx / parentWidth) * 100;
      const signed = edge === "right" ? deltaPct : -deltaPct;
      setDragWidth(clampWidth(startWidth + signed));
    }
    function onUp(ev: PointerEvent) {
      const dx = ev.clientX - startX;
      const deltaPct = (dx / parentWidth) * 100;
      const signed = edge === "right" ? deltaPct : -deltaPct;
      commitWidth(startWidth + signed);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  async function downloadImage() {
    if (!url) return;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = "image.jpg";
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  if (!url) {
    return (
      <div className="nv-image nv-image-empty-wrap" onFocus={props.onFocus}>
        <div className="nv-image-empty">
          <span className="nv-image-empty-icon">
            <ImageIcon className="size-5" />
          </span>
          <div className="nv-image-empty-copy">
            <p className="nv-image-empty-title">Add an image</p>
            <p className="nv-image-empty-hint">Upload a file or paste an image URL</p>
          </div>
        </div>
        {!props.readOnly && (
          <>
            <div className="nv-media-upload-row">
              <MediaUploadButton
                accept="image/*"
                label="Upload image"
                onUploaded={(next) => {
                  props.commands.updateBlock(props.block.id, { url: next });
                  props.onFocus();
                }}
                onError={(msg) => toast.error(msg)}
              />
            </div>
            <div className="nv-image-url-bar">
              <Link2 className="size-3.5 shrink-0 opacity-50" />
              <input
                className="nv-image-url-inline"
                placeholder="https://… image URL"
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
    <div
      ref={rootRef}
      className={`nv-image nv-image-align-${align}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        if (!selected && !editingUrl && !editingCaption) setHovered(false);
      }}
      onFocus={props.onFocus}
    >
      <div
        ref={wrapRef}
        className={`nv-image-shell ${showChrome ? "nv-image-shell-active" : ""} ${selected ? "nv-image-shell-selected" : ""}`}
        style={{ width: `${width}%` }}
      >
        <AnimatePresence>
          {showChrome && (
            <motion.div
              className="nv-image-toolbar"
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={easeOutSoft}
              onMouseDown={(e) => e.preventDefault()}
            >
              <div className="nv-image-toolbar-group">
                <Tool label="Full screen" onClick={() => setViewerOpen(true)}>
                  <Expand className="size-3.5" />
                </Tool>
                <Tool label="Download" onClick={() => void downloadImage()}>
                  <Download className="size-3.5" />
                </Tool>
              </div>
              <span className="nv-image-toolbar-sep" />
              <div className="nv-image-toolbar-group">
                <Tool
                  label="Align left"
                  active={align === "left"}
                  onClick={() => setAlign("left")}
                >
                  <AlignLeft className="size-3.5" />
                </Tool>
                <Tool
                  label="Align center"
                  active={align === "center"}
                  onClick={() => setAlign("center")}
                >
                  <AlignCenter className="size-3.5" />
                </Tool>
                <Tool
                  label="Align right"
                  active={align === "right"}
                  onClick={() => setAlign("right")}
                >
                  <AlignRight className="size-3.5" />
                </Tool>
              </div>
              <span className="nv-image-toolbar-sep" />
              <div className="nv-image-toolbar-group">
                <Tool
                  label="Caption"
                  active={editingCaption || !!caption.trim()}
                  onClick={() => {
                    setSelected(true);
                    setEditingCaption(true);
                  }}
                >
                  <Captions className="size-3.5" />
                </Tool>
                <Tool
                  label="Replace link"
                  active={editingUrl}
                  onClick={() => {
                    setSelected(true);
                    setEditingUrl((v) => !v);
                  }}
                >
                  <Link2 className="size-3.5" />
                </Tool>
                <Tool label="Reset width" onClick={() => commitWidth(100)}>
                  <span className="nv-image-toolbar-pct">{Math.round(width)}%</span>
                </Tool>
              </div>
              <span className="nv-image-toolbar-sep" />
              <Tool
                label="Delete"
                danger
                onClick={() => props.commands.deleteBlock(props.block.id)}
              >
                <Trash2 className="size-3.5" />
              </Tool>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {editingUrl && !props.readOnly && (
            <motion.div
              className="nv-image-url-bar nv-image-url-bar-overlay"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              <Link2 className="size-3.5 shrink-0 opacity-50" />
              <input
                ref={urlRef}
                className="nv-image-url-inline"
                placeholder="https://… image URL"
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyUrl(urlDraft);
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setUrlDraft(url);
                    setEditingUrl(false);
                  }
                }}
              />
              <button
                type="button"
                className="nv-image-url-apply"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyUrl(urlDraft)}
              >
                Save
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          className="nv-image-frame"
          onClick={() => {
            if (props.readOnly) {
              setViewerOpen(true);
              return;
            }
            props.onFocus();
            setSelected(true);
          }}
          onDoubleClick={() => setViewerOpen(true)}
          aria-label={`Select image: ${alt}`}
        >
          {broken ? (
            <div className="nv-image-broken">
              <ImageIcon className="size-5" />
              <span>Couldn’t load image</span>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={alt}
              className="nv-image-preview"
              onError={() => setBroken(true)}
              draggable={false}
            />
          )}
        </button>

        {!props.readOnly && showChrome && (
          <>
            <button
              type="button"
              className="nv-image-handle nv-image-handle-left"
              aria-label="Resize image"
              onPointerDown={(e) => startResize("left", e)}
            />
            <button
              type="button"
              className="nv-image-handle nv-image-handle-right"
              aria-label="Resize image"
              onPointerDown={(e) => startResize("right", e)}
            />
          </>
        )}

        {(editingCaption || caption.trim() || (showChrome && selected)) && (
          <div className="nv-image-caption-wrap">
            {props.readOnly ? (
              caption.trim() ? <p className="nv-image-caption">{caption}</p> : null
            ) : (
              <input
                ref={captionRef}
                className="nv-image-caption-input"
                placeholder="Add a caption…"
                value={caption}
                onChange={(e) => props.onTextChange(e.target.value)}
                onFocus={() => {
                  props.onFocus();
                  setSelected(true);
                  setEditingCaption(true);
                }}
                onBlur={() => setEditingCaption(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    (e.target as HTMLInputElement).blur();
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    (e.target as HTMLInputElement).blur();
                    setSelected(false);
                  }
                }}
              />
            )}
          </div>
        )}
      </div>

      <ImageViewer
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        images={[{ src: url, alt }]}
      />
    </div>
  );
}

function Tool({
  label,
  onClick,
  children,
  active,
  danger,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      className={`nv-image-tool ${active ? "nv-image-tool-active" : ""} ${danger ? "nv-image-tool-danger" : ""}`}
      title={label}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function clampWidth(n: number) {
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(n)));
}
