"use client";

import {
  Download,
  ExternalLink,
  Maximize2,
  Minimize2,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { createPortal } from "react-dom";
import { easeOutSoft, overlayVariants } from "@/lib/motion";

export type ImageViewerItem = {
  src: string;
  alt?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  images: ImageViewerItem[];
  index?: number;
  onIndexChange?: (index: number) => void;
};

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.35;

export function ImageViewer({
  open,
  onClose,
  images,
  index = 0,
  onIndexChange,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(index);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragOrigin = useRef<{ x: number; y: number; ox: number; oy: number } | null>(
    null,
  );

  const resetTransform = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setActive(Math.min(Math.max(0, index), Math.max(0, images.length - 1)));
    resetTransform();
  }, [open, index, images.length, resetTransform]);

  const current = images[active];
  const hasGallery = images.length > 1;

  const zoomBy = useCallback((delta: number) => {
    setScale((s) => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, s + delta));
      if (next <= MIN_SCALE) setOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const go = useCallback(
    (dir: -1 | 1) => {
      if (!hasGallery) return;
      const next = (active + dir + images.length) % images.length;
      setActive(next);
      onIndexChange?.(next);
      resetTransform();
    },
    [active, hasGallery, images.length, onIndexChange, resetTransform],
  );

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomBy(ZOOM_STEP);
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        zoomBy(-ZOOM_STEP);
      } else if (e.key === "0") {
        e.preventDefault();
        resetTransform();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      }
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, zoomBy, resetTransform, go]);

  function onWheel(e: ReactWheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP * 0.6 : ZOOM_STEP * 0.6;
    zoomBy(delta);
  }

  function onPointerDown(e: ReactPointerEvent) {
    if (scale <= 1) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    dragOrigin.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }

  function onPointerMove(e: ReactPointerEvent) {
    if (!dragOrigin.current || scale <= 1) return;
    const dx = e.clientX - dragOrigin.current.x;
    const dy = e.clientY - dragOrigin.current.y;
    setOffset({ x: dragOrigin.current.ox + dx, y: dragOrigin.current.oy + dy });
  }

  function onPointerUp(e: ReactPointerEvent) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setDragging(false);
    dragOrigin.current = null;
  }

  function onDoubleClick() {
    if (scale > 1) resetTransform();
    else setScale(2.2);
  }

  async function downloadImage() {
    if (!current?.src) return;
    try {
      const res = await fetch(current.src);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filenameFromSrc(current.src, current.alt);
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(current.src, "_blank", "noopener,noreferrer");
    }
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && current && (
        <motion.div
          className="image-viewer"
          role="dialog"
          aria-modal="true"
          aria-label={current.alt || "Image viewer"}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.18 }}
        >
          <button
            type="button"
            className="image-viewer-backdrop"
            aria-label="Close viewer"
            onClick={onClose}
          />

          <header className="image-viewer-bar">
            <div className="image-viewer-meta">
              <p className="image-viewer-caption">
                {current.alt?.trim() || "Image"}
              </p>
              {hasGallery && (
                <span className="image-viewer-count">
                  {active + 1} / {images.length}
                </span>
              )}
            </div>
            <div className="image-viewer-actions">
              <ToolBtn label="Zoom out" onClick={() => zoomBy(-ZOOM_STEP)}>
                <ZoomOut className="size-4" />
              </ToolBtn>
              <span className="image-viewer-zoom">{Math.round(scale * 100)}%</span>
              <ToolBtn label="Zoom in" onClick={() => zoomBy(ZOOM_STEP)}>
                <ZoomIn className="size-4" />
              </ToolBtn>
              <ToolBtn
                label={scale > 1 ? "Fit" : "Zoom 200%"}
                onClick={() => (scale > 1 ? resetTransform() : setScale(2))}
              >
                {scale > 1 ? (
                  <Minimize2 className="size-4" />
                ) : (
                  <Maximize2 className="size-4" />
                )}
              </ToolBtn>
              <ToolBtn label="Reset" onClick={resetTransform}>
                <RotateCcw className="size-4" />
              </ToolBtn>
              <ToolBtn label="Download" onClick={() => void downloadImage()}>
                <Download className="size-4" />
              </ToolBtn>
              <a
                className="image-viewer-tool"
                href={current.src}
                target="_blank"
                rel="noopener noreferrer"
                title="Open original"
                aria-label="Open original"
              >
                <ExternalLink className="size-4" />
              </a>
              <ToolBtn label="Close" onClick={onClose}>
                <X className="size-4" />
              </ToolBtn>
            </div>
          </header>

          <div
            className={`image-viewer-stage ${scale > 1 ? "image-viewer-stage-zoomed" : ""} ${dragging ? "image-viewer-stage-dragging" : ""}`}
            onClick={(e) => {
              if (e.target === e.currentTarget && scale <= 1) onClose();
            }}
            onWheel={onWheel}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onDoubleClick={onDoubleClick}
          >
            <motion.img
              key={current.src}
              src={current.src}
              alt={current.alt || "Image"}
              className="image-viewer-img"
              draggable={false}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={easeOutSoft}
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              }}
            />
          </div>

          {hasGallery && (
            <>
              <button
                type="button"
                className="image-viewer-nav image-viewer-nav-prev"
                aria-label="Previous image"
                onClick={() => go(-1)}
              >
                ‹
              </button>
              <button
                type="button"
                className="image-viewer-nav image-viewer-nav-next"
                aria-label="Next image"
                onClick={() => go(1)}
              >
                ›
              </button>
            </>
          )}

          <p className="image-viewer-hint">
            Scroll to zoom · drag to pan · Esc to close
            {hasGallery ? " · ← → to browse" : ""}
          </p>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function ToolBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="image-viewer-tool"
      title={label}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function filenameFromSrc(src: string, alt?: string) {
  try {
    const path = new URL(src).pathname;
    const base = path.split("/").pop();
    if (base && /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(base)) return base;
  } catch {
    /* ignore */
  }
  const safe = (alt || "image").replace(/[^\w.-]+/g, "-").slice(0, 40);
  return `${safe || "image"}.jpg`;
}
