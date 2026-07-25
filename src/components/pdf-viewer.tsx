"use client";

import { createPluginRegistration } from "@embedpdf/core";
import { EmbedPDF } from "@embedpdf/core/react";
import { usePdfiumEngine } from "@embedpdf/engines/react";
import {
  DocumentContent,
  DocumentManagerPluginPackage,
} from "@embedpdf/plugin-document-manager/react";
import { RenderLayer, RenderPluginPackage } from "@embedpdf/plugin-render/react";
import { Scroller, ScrollPluginPackage, useScroll } from "@embedpdf/plugin-scroll/react";
import { Viewport, ViewportPluginPackage } from "@embedpdf/plugin-viewport/react";
import {
  ZoomMode,
  ZoomPluginPackage,
  useZoom,
} from "@embedpdf/plugin-zoom/react";
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  ExternalLink,
  FileText,
  Minimize2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

/** Self-hosted PDFium WASM (copied from @embedpdf/pdfium on postinstall). */
const PDFIUM_WASM_URL = "/embedpdf/pdfium.wasm";

type Props = {
  src: string;
  title?: string;
  /** Embedded preview height (default 28rem) */
  height?: number | string;
  className?: string;
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
};

type DocSource =
  | { kind: "buffer"; buffer: ArrayBuffer; name: string }
  | { kind: "url"; url: string; name: string };

function filenameFromSrc(src: string, fallback = "document.pdf") {
  try {
    const path = new URL(src, window.location.origin).pathname;
    const base = path.split("/").pop();
    if (base && /\.pdf$/i.test(base)) return decodeURIComponent(base);
  } catch {
    /* ignore */
  }
  return fallback;
}

/**
 * Fetch PDF bytes so EmbedPDF can open via buffer (more reliable than
 * cross-origin URL range requests against Convex / CDNs).
 */
async function resolveDocSource(src: string, title?: string): Promise<DocSource> {
  const name = title?.trim() || filenameFromSrc(src);
  try {
    const res = await fetch(src, { mode: "cors", credentials: "omit" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength < 5) throw new Error("Empty PDF");
    return { kind: "buffer", buffer, name };
  } catch {
    return { kind: "url", url: src, name };
  }
}

export function PdfViewer({
  src,
  title,
  height = "28rem",
  className = "",
  fullscreen = false,
  onToggleFullscreen,
}: Props) {
  const { engine, isLoading, error } = usePdfiumEngine({
    wasmUrl: PDFIUM_WASM_URL,
    worker: true,
  });

  const [source, setSource] = useState<DocSource | null>(null);
  const [sourceError, setSourceError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSource(null);
    setSourceError(null);
    void resolveDocSource(src, title).then((doc) => {
      if (cancelled) return;
      setSource(doc);
    }).catch((err: unknown) => {
      if (cancelled) return;
      setSourceError(err instanceof Error ? err.message : "Couldn’t load PDF");
    });
    return () => {
      cancelled = true;
    };
  }, [src, title]);

  const plugins = useMemo(() => {
    if (!source) return [];
    const initial =
      source.kind === "buffer"
        ? [{ buffer: source.buffer.slice(0), name: source.name }]
        : [{ url: source.url, name: source.name, mode: "full-fetch" as const }];

    return [
      createPluginRegistration(DocumentManagerPluginPackage, {
        initialDocuments: initial,
      }),
      createPluginRegistration(ViewportPluginPackage),
      createPluginRegistration(ScrollPluginPackage),
      createPluginRegistration(RenderPluginPackage),
      createPluginRegistration(ZoomPluginPackage, {
        defaultZoomLevel: ZoomMode.FitWidth,
        minZoom: 0.4,
        maxZoom: 4,
      }),
    ];
  }, [source]);

  if (error) {
    return (
      <div className={`nv-pdf-status nv-pdf-status-error ${className}`}>
        <FileText className="size-5" />
        <p>Couldn’t load PDF engine</p>
        <span>{error.message}</span>
      </div>
    );
  }

  if (sourceError) {
    return (
      <div className={`nv-pdf-status nv-pdf-status-error ${className}`}>
        <FileText className="size-5" />
        <p>Couldn’t load this PDF</p>
        <span>{sourceError}</span>
        <a className="nv-pdf-status-link" href={src} target="_blank" rel="noopener noreferrer">
          Open in new tab
        </a>
      </div>
    );
  }

  if (isLoading || !engine || !source) {
    return (
      <div className={`nv-pdf-status ${className}`} style={{ height }}>
        <div className="nv-pdf-spinner" aria-hidden />
        <p>{isLoading || !engine ? "Loading PDF engine…" : "Fetching document…"}</p>
      </div>
    );
  }

  const viewerKey =
    source.kind === "buffer"
      ? `buf:${source.name}:${source.buffer.byteLength}`
      : `url:${source.url}`;

  return (
    <div
      className={`nv-pdf-viewer ${fullscreen ? "nv-pdf-viewer-fullscreen" : ""} ${className}`}
      style={fullscreen ? undefined : { height }}
    >
      <EmbedPDF key={viewerKey} engine={engine} plugins={plugins}>
        {({ activeDocumentId }) =>
          activeDocumentId ? (
            <DocumentContent documentId={activeDocumentId}>
              {({ isLoaded, isLoading: docLoading, isError }) => {
                if (isError) {
                  return (
                    <div className="nv-pdf-status nv-pdf-status-error">
                      <FileText className="size-5" />
                      <p>Couldn’t open this PDF</p>
                      <span>The file may be corrupted or password-protected</span>
                      <a
                        className="nv-pdf-status-link"
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open in new tab
                      </a>
                    </div>
                  );
                }
                if (docLoading || !isLoaded) {
                  return (
                    <div className="nv-pdf-status">
                      <div className="nv-pdf-spinner" aria-hidden />
                      <p>Opening document…</p>
                    </div>
                  );
                }
                return (
                  <PdfShell
                    documentId={activeDocumentId}
                    title={title || source.name}
                    src={src}
                    fullscreen={fullscreen}
                    onToggleFullscreen={onToggleFullscreen}
                  />
                );
              }}
            </DocumentContent>
          ) : (
            <div className="nv-pdf-status">
              <div className="nv-pdf-spinner" aria-hidden />
              <p>Preparing viewer…</p>
            </div>
          )
        }
      </EmbedPDF>
    </div>
  );
}

function PdfShell({
  documentId,
  title,
  src,
  fullscreen,
  onToggleFullscreen,
}: {
  documentId: string;
  title?: string;
  src: string;
  fullscreen: boolean;
  onToggleFullscreen?: () => void;
}) {
  const { provides: zoom, state: zoomState } = useZoom(documentId);
  const { provides: scroll, state: scrollState } = useScroll(documentId);
  const current = scrollState.currentPage || 1;
  const total = scrollState.totalPages || 1;
  const zoomPct = Math.round((zoomState.currentZoomLevel || 1) * 100);

  return (
    <div className="nv-pdf-shell">
      <header className="nv-pdf-toolbar">
        <div className="nv-pdf-toolbar-meta">
          <FileText className="size-3.5 shrink-0 opacity-70" />
          <span className="nv-pdf-toolbar-title">{title?.trim() || "PDF"}</span>
        </div>
        <div className="nv-pdf-toolbar-actions">
          <button
            type="button"
            className="nv-pdf-tool"
            title="Previous page"
            aria-label="Previous page"
            disabled={current <= 1}
            onClick={() => scroll?.scrollToPreviousPage("smooth")}
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <span className="nv-pdf-page">
            {current} / {total}
          </span>
          <button
            type="button"
            className="nv-pdf-tool"
            title="Next page"
            aria-label="Next page"
            disabled={current >= total}
            onClick={() => scroll?.scrollToNextPage("smooth")}
          >
            <ChevronRight className="size-3.5" />
          </button>
          <span className="nv-pdf-toolbar-sep" />
          <button
            type="button"
            className="nv-pdf-tool"
            title="Zoom out"
            aria-label="Zoom out"
            onClick={() => zoom?.zoomOut()}
          >
            <ZoomOut className="size-3.5" />
          </button>
          <button
            type="button"
            className="nv-pdf-tool nv-pdf-zoom-label"
            title="Fit width"
            aria-label="Fit width"
            onClick={() => zoom?.requestZoom(ZoomMode.FitWidth)}
          >
            {zoomPct}%
          </button>
          <button
            type="button"
            className="nv-pdf-tool"
            title="Zoom in"
            aria-label="Zoom in"
            onClick={() => zoom?.zoomIn()}
          >
            <ZoomIn className="size-3.5" />
          </button>
          <span className="nv-pdf-toolbar-sep" />
          <a
            className="nv-pdf-tool"
            href={src}
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
              className="nv-pdf-tool"
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

      <Viewport
        documentId={documentId}
        style={{
          flex: 1,
          background: "transparent",
          overflow: "auto",
        }}
      >
        <Scroller
          documentId={documentId}
          renderPage={({ width, height, pageIndex }) => (
            <div className="nv-pdf-page-wrap" style={{ width, height }}>
              <RenderLayer documentId={documentId} pageIndex={pageIndex} />
            </div>
          )}
        />
      </Viewport>
    </div>
  );
}
