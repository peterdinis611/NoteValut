"use client";

import {
  Expand,
  ExternalLink,
  Film,
  Minimize2,
  Pause,
  Play,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { easeOutSoft, overlayVariants } from "@/lib/motion";
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
          YouTube, Vimeo, Loom, Twitch, TikTok, Dailymotion, Streamable, Wistia, or a
          direct file
        </span>
      </div>
    );
  }

  const aspect = source.aspect ?? "landscape";

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
        {source.embedUrl ? (
          <iframe
            key={source.embedUrl}
            src={source.embedUrl}
            title={title || source.label}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="nv-video-embed"
          />
        ) : source.fileUrl ? (
          <NativeVideoPlayer src={source.fileUrl} title={title || source.label} />
        ) : null}
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
        <span className={`nv-video-badge nv-video-badge-${source.provider}`}>
          {source.label}
        </span>
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
            {fullscreen ? (
              <Minimize2 className="size-3.5" />
            ) : (
              <Expand className="size-3.5" />
            )}
          </button>
        )}
      </div>
    </header>
  );
}

function NativeVideoPlayer({ src, title }: { src: string; title: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  function togglePlay() {
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  }

  return (
    <div className="nv-video-native">
      <video
        ref={ref}
        src={src}
        title={title}
        className="nv-video-file"
        playsInline
        onClick={togglePlay}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={() => {
          const el = ref.current;
          if (!el || !el.duration) return;
          setProgress(el.currentTime / el.duration);
        }}
        onLoadedMetadata={() => setDuration(ref.current?.duration ?? 0)}
      />
      {!playing && (
        <button
          type="button"
          className="nv-video-play-fab"
          aria-label="Play"
          onClick={togglePlay}
        >
          <Play className="size-7 fill-current" />
        </button>
      )}
      <div className="nv-video-controls" onMouseDown={(e) => e.preventDefault()}>
        <button
          type="button"
          className="nv-video-tool"
          aria-label={playing ? "Pause" : "Play"}
          onClick={togglePlay}
        >
          {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
        </button>
        <input
          type="range"
          className="nv-video-seek"
          min={0}
          max={1}
          step={0.001}
          value={progress}
          aria-label="Seek"
          onChange={(e) => {
            const el = ref.current;
            if (!el || !el.duration) return;
            const next = Number(e.target.value);
            el.currentTime = next * el.duration;
            setProgress(next);
          }}
        />
        <span className="nv-video-time">
          {formatTime(progress * duration)} / {formatTime(duration)}
        </span>
        <button
          type="button"
          className="nv-video-tool"
          aria-label={muted ? "Unmute" : "Mute"}
          onClick={() => {
            const el = ref.current;
            if (!el) return;
            el.muted = !el.muted;
            setMuted(el.muted);
          }}
        >
          {muted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
        </button>
      </div>
    </div>
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
    <AnimatePresence>
      {open && (
        <motion.div
          className="nv-video-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={title || "Video viewer"}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.18 }}
        >
          <button
            type="button"
            className="nv-video-overlay-backdrop"
            aria-label="Close video viewer"
            onClick={onClose}
          />
          <motion.div
            className="nv-video-overlay-panel"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={easeOutSoft}
          >
            <button
              type="button"
              className="nv-video-overlay-close"
              aria-label="Close"
              onClick={onClose}
            >
              <X className="size-4" />
            </button>
            <VideoViewer
              src={src}
              title={title}
              fullscreen
              onToggleFullscreen={onClose}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
