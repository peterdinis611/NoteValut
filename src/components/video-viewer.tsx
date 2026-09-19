"use client";

import {
  Expand,
  ExternalLink,
  Film,
  Minimize2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ReactPlayer from "react-player";
import { AnimePresence } from "@/lib/anime-ui";
import { resolveVideoSource, type VideoSource } from "@/lib/video";

type Props = {
  src: string;
  title?: string;
  className?: string;
  /** Compact embed in the editor */
  compact?: boolean;
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
};

export function VideoViewer({
  src,
  title,
  className = "",
  compact = false,
  fullscreen = false,
  onToggleFullscreen,
}: Props) {
  const [parentHost, setParentHost] = useState("localhost");
  useEffect(() => {
    setParentHost(window.location.hostname || "localhost");
  }, []);

  const source = resolveVideoSource(src, { parentHost });

  if (!source) {
    return (
      <div className={`nv-video-status nv-video-status-error ${className}`}>
        <Film className="size-5" />
        <p>Unsupported video URL</p>
        <span>
          YouTube, Vimeo, Loom, Twitch, TikTok, Dailymotion, Streamable, Wistia, or a direct file
        </span>
      </div>
    );
  }

  const aspect = source.aspect ?? "landscape";
  // Prefer react-player for YouTube/Vimeo/Wistia/file; keep iframe for niche embeds.
  const usePlayer =
    source.provider === "youtube" ||
    source.provider === "vimeo" ||
    source.provider === "wistia" ||
    source.provider === "file" ||
    Boolean(source.fileUrl);

  return (
    <div
      className={`nv-video-viewer nv-video-aspect-${aspect} ${compact ? "nv-video-viewer-compact" : ""} ${fullscreen ? "nv-video-viewer-fullscreen" : ""} ${className}`}
    >
      <VideoChrome
        source={source}
        title={title}
        fullscreen={fullscreen}
        onToggleFullscreen={onToggleFullscreen}
      />
      <div className="nv-video-stage">
        {usePlayer ? (
          <ReactPlayer
            src={source.fileUrl || source.src}
            controls
            width="100%"
            height="100%"
            className="nv-video-react-player"
            style={{ position: "absolute", inset: 0 }}
          />
        ) : source.embedUrl ? (
          <iframe
            key={source.embedUrl}
            src={source.embedUrl}
            title={title || source.label}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="nv-video-embed"
          />
        ) : (
          <div className="nv-video-status nv-video-status-error">
            <Film className="size-5" />
            <p>Can’t play this URL</p>
          </div>
        )}
      </div>
    </div>
  );
}

function VideoChrome({
  source,
  title,
  fullscreen,
  onToggleFullscreen,
}: {
  source: VideoSource;
  title?: string;
  fullscreen: boolean;
  onToggleFullscreen?: () => void;
}) {
  return (
    <header className="nv-video-toolbar">
      <div className="nv-video-toolbar-meta">
        <span className={`nv-video-badge nv-video-badge-${source.provider}`}>{source.label}</span>
        <span className="nv-video-toolbar-title">{title?.trim() || "Video"}</span>
      </div>
      <div className="nv-video-toolbar-actions">
        <a
          className="nv-video-tool"
          href={source.src}
          target="_blank"
          rel="noopener noreferrer"
          title="Open original"
          aria-label="Open original"
        >
          <ExternalLink className="size-3.5" />
        </a>
        {onToggleFullscreen && (
          <button
            type="button"
            className="nv-video-tool"
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
            aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
            onClick={onToggleFullscreen}
          >
            {fullscreen ? <Minimize2 className="size-3.5" /> : <Expand className="size-3.5" />}
          </button>
        )}
      </div>
    </header>
  );
}

/** Fullscreen overlay portal for the video viewer. */
export function VideoViewerOverlay({
  open,
  onClose,
  src,
  title,
}: {
  open: boolean;
  onClose: () => void;
  src: string;
  title?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimePresence show={open} kind="overlay">
      <div
        className="nv-video-overlay"
        role="dialog"
        aria-modal="true"
        aria-label={title || "Video viewer"}
      >
        <button
          type="button"
          className="nv-video-overlay-backdrop"
          aria-label="Close video viewer"
          onClick={onClose}
        />
        <div className="nv-video-overlay-panel">
            <button
              type="button"
              className="nv-video-overlay-close"
              aria-label="Close"
              onClick={onClose}
            >
              <X className="size-4" />
            </button>
            <VideoViewer src={src} title={title} fullscreen onToggleFullscreen={onClose} />
        </div>
      </div>
    </AnimePresence>,
    document.body,
  );
}

