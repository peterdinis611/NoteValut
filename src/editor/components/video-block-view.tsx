"use client";

import { Expand, Film, Link2, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { MediaUploadButton } from "@/components/media-upload-button";
import { VideoViewer, VideoViewerOverlay } from "@/components/video-viewer";
import { useToast } from "@/components/toast";
import { resolveVideoSource, VIDEO_PROVIDER_CATALOG } from "@/lib/video";
import type { BlockRenderProps } from "../types";

export function VideoBlockView(props: BlockRenderProps) {
  const toast = useToast();
  const [fullscreen, setFullscreen] = useState(false);
  const [editingUrl, setEditingUrl] = useState(false);
  const [urlDraft, setUrlDraft] = useState(props.block.url ?? "");
  const [selected, setSelected] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);

  const url = props.block.url?.trim() ?? "";
  const title = props.block.text.trim() || props.block.label?.trim() || "Video";
  const source = url ? resolveVideoSource(url) : null;

  useEffect(() => {
    setUrlDraft(props.block.url ?? "");
  }, [props.block.url]);

  useEffect(() => {
    if (editingUrl) urlRef.current?.focus();
  }, [editingUrl]);

  useEffect(() => {
    if (!selected && !editingUrl) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node | null;
      if (!target || rootRef.current?.contains(target)) return;
      if (editingUrl) applyUrl(urlDraft);
      setEditingUrl(false);
      setSelected(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (editingUrl) {
          setUrlDraft(url);
          setEditingUrl(false);
        }
        setSelected(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [selected, editingUrl, urlDraft, url]);

  function applyUrl(next: string) {
    const trimmed = next.trim();
    props.commands.updateBlock(props.block.id, { url: trimmed || undefined });
    setEditingUrl(false);
  }

  if (!url) {
    return (
      <div className="nv-video nv-video-empty-wrap" onFocus={props.onFocus}>
        <div className="nv-video-empty">
          <span className="nv-video-empty-icon">
            <Film className="size-5" />
          </span>
          <div className="nv-video-empty-copy">
            <p className="nv-video-empty-title">Embed a video</p>
            <p className="nv-video-empty-hint">Upload a file or paste a link from any provider</p>
          </div>
        </div>
        <div className="nv-video-providers" aria-label="Supported providers">
          {VIDEO_PROVIDER_CATALOG.map((p) => (
            <span key={p.id} className={`nv-video-provider-chip nv-video-badge-${p.id}`} title={p.example}>
              {p.label}
            </span>
          ))}
        </div>
        {!props.readOnly && (
          <>
            <div className="nv-media-upload-row">
              <MediaUploadButton
                accept="video/*,.mp4,.webm,.mov,.m4v"
                label="Upload video"
                onUploaded={(next) => {
                  props.commands.updateBlock(props.block.id, { url: next });
                  props.onFocus();
                }}
                onError={(msg) => toast.error(msg)}
              />
            </div>
            <div className="nv-video-url-bar">
              <Link2 className="size-3.5 shrink-0 opacity-50" />
              <input
                className="nv-video-url-inline"
                placeholder="https://… YouTube, Vimeo, Twitch, TikTok, .mp4…"
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
      className={`nv-video ${selected ? "nv-video-selected" : ""}`}
      onFocus={props.onFocus}
      onClick={() => {
        if (!props.readOnly) setSelected(true);
      }}
    >
      {!props.readOnly && (
        <div className="nv-video-chrome">
          <input
            className="nv-video-title-input"
            placeholder="Video title"
            value={props.block.text}
            onChange={(e) => props.onTextChange(e.target.value)}
            onFocus={() => {
              props.onFocus();
              setSelected(true);
            }}
          />
          <div className="nv-video-chrome-actions">
            <button
              type="button"
              className={`nv-video-chrome-btn ${editingUrl ? "nv-video-chrome-btn-active" : ""}`}
              title="Replace link"
              aria-label="Replace link"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setEditingUrl((v) => !v)}
            >
              <Link2 className="size-3.5" />
            </button>
            <button
              type="button"
              className="nv-video-chrome-btn"
              title="Fullscreen"
              aria-label="Fullscreen"
              onClick={() => setFullscreen(true)}
            >
              <Expand className="size-3.5" />
            </button>
            <button
              type="button"
              className="nv-video-chrome-btn nv-video-chrome-btn-danger"
              title="Delete"
              aria-label="Delete video"
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
            className="nv-video-url-bar"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            <Link2 className="size-3.5 shrink-0 opacity-50" />
            <input
              ref={urlRef}
              className="nv-video-url-inline"
              placeholder="https://… video URL"
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
              className="nv-video-url-apply"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyUrl(urlDraft)}
            >
              Save
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {source ? (
        <VideoViewer
          src={url}
          title={title}
          compact
          onToggleFullscreen={() => setFullscreen(true)}
        />
      ) : (
        <div className="nv-video-status nv-video-status-error">
          <Film className="size-5" />
          <p>Couldn’t parse this URL</p>
          <button
            type="button"
            className="nv-video-url-apply"
            onClick={() => setEditingUrl(true)}
          >
            Edit link
          </button>
        </div>
      )}

      <VideoViewerOverlay
        open={fullscreen}
        onClose={() => setFullscreen(false)}
        src={url}
        title={title}
      />
    </div>
  );
}
