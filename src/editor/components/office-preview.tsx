"use client";

import { useEffect, useState } from "react";
import { fileExtension } from "@/hooks/use-vault-upload";

type Props = {
  url: string;
  name: string;
};

type PreviewState =
  | { status: "loading" }
  | { status: "ready"; html: string; kind: "word" | "excel" }
  | { status: "office-online" }
  | { status: "error"; message: string };

function canUseOfficeOnline(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export function OfficePreview({ url, name }: Props) {
  const [state, setState] = useState<PreviewState>({ status: "loading" });
  const ext = fileExtension(name || url);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState({ status: "loading" });

      if (ext === "pptx" || ext === "ppt" || ext === "doc") {
        if (canUseOfficeOnline(url)) {
          if (!cancelled) setState({ status: "office-online" });
          return;
        }
        if (!cancelled) {
          setState({
            status: "error",
            message: "Preview isn’t available for this format — download to open.",
          });
        }
        return;
      }

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Couldn’t fetch file");
        const buffer = await res.arrayBuffer();

        if (ext === "docx") {
          const mammoth = await import("mammoth");
          const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
          if (cancelled) return;
          setState({
            status: "ready",
            kind: "word",
            html: wrapPreviewHtml(result.value, "word"),
          });
          return;
        }

        if (ext === "xlsx" || ext === "xls") {
          const XLSX = await import("xlsx");
          const workbook = XLSX.read(buffer, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          if (!sheetName) throw new Error("Workbook has no sheets");
          const sheet = workbook.Sheets[sheetName];
          const table = XLSX.utils.sheet_to_html(sheet, { id: "nv-sheet" });
          if (cancelled) return;
          setState({
            status: "ready",
            kind: "excel",
            html: wrapPreviewHtml(
              `<p class="nv-office-sheet-label">${escapeHtml(sheetName)}</p>${table}`,
              "excel",
            ),
          });
          return;
        }

        if (canUseOfficeOnline(url)) {
          if (!cancelled) setState({ status: "office-online" });
          return;
        }

        if (!cancelled) {
          setState({
            status: "error",
            message: "Preview isn’t available for this file type.",
          });
        }
      } catch {
        if (cancelled) return;
        if (canUseOfficeOnline(url)) {
          setState({ status: "office-online" });
          return;
        }
        setState({
          status: "error",
          message: "Couldn’t render preview — download the file instead.",
        });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [url, name, ext]);

  if (state.status === "loading") {
    return <div className="nv-office-preview nv-office-preview-loading">Loading preview…</div>;
  }

  if (state.status === "error") {
    return <div className="nv-office-preview nv-office-preview-error">{state.message}</div>;
  }

  if (state.status === "office-online") {
    const src = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
    return (
      <div className="nv-office-preview nv-office-preview-frame-wrap">
        <iframe
          className="nv-office-preview-frame"
          title={`Preview ${name}`}
          src={src}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    );
  }

  return (
    <div className={`nv-office-preview nv-office-preview-${state.kind}`}>
      <iframe
        className="nv-office-preview-html"
        title={`Preview ${name}`}
        sandbox=""
        srcDoc={state.html}
      />
    </div>
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function wrapPreviewHtml(body: string, kind: "word" | "excel") {
  const excelExtra =
    kind === "excel"
      ? `
table { border-collapse: collapse; width: 100%; font-size: 12px; }
td, th { border: 1px solid #d8cfc0; padding: 0.35rem 0.5rem; vertical-align: top; }
th { background: #f3ead8; font-weight: 650; }
.nv-office-sheet-label { margin: 0 0 0.65rem; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #5a5248; font-weight: 650; }
`
      : `
p { margin: 0 0 0.75rem; }
h1,h2,h3,h4 { margin: 1rem 0 0.45rem; line-height: 1.2; }
ul, ol { margin: 0 0 0.75rem; padding-left: 1.25rem; }
img { max-width: 100%; height: auto; }
table { border-collapse: collapse; width: 100%; margin: 0.75rem 0; }
td, th { border: 1px solid #d8cfc0; padding: 0.35rem 0.5rem; }
`;

  return `<!doctype html><html><head><meta charset="utf-8" />
<style>
  html, body { margin: 0; padding: 0; background: #fffdf8; color: #171412;
    font-family: Sora, ui-sans-serif, system-ui, sans-serif; font-size: 14px; line-height: 1.55; }
  body { padding: 1rem 1.1rem 1.25rem; }
  a { color: #c4480e; }
  ${excelExtra}
</style></head><body>${body}</body></html>`;
}
