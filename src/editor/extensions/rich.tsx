"use client";

import { ExternalLink, Film, Link2, Plus, Trash2 } from "lucide-react";
import { emptyTable, youtubeEmbedUrl } from "@/lib/blocks";
import { Extension } from "../create-extension";
import type { BlockRenderProps } from "../types";

export const TableBlock = Extension({
  name: "table",
  types: ["table"],
  atom: true,
  slashCommands: [
    {
      id: "table",
      type: "table",
      label: "Table",
      description: "Rows and columns",
      icon: "▦",
      keywords: ["table", "grid", "spreadsheet"],
      group: "Media",
    },
  ],
  render: (props) => <TableView {...props} />,
});

function TableView(props: BlockRenderProps) {
  const rows = props.block.rows?.length ? props.block.rows : emptyTable();
  const cols = Math.max(...rows.map((r) => r.length), 1);

  function updateCell(r: number, c: number, value: string) {
    const next = rows.map((row, ri) =>
      row.map((cell, ci) => (ri === r && ci === c ? value : cell)),
    );
    props.commands.updateBlock(props.block.id, { rows: next });
  }

  function addRow() {
    props.commands.updateBlock(props.block.id, {
      rows: [...rows, Array.from({ length: cols }, () => "")],
    });
  }

  function addCol() {
    props.commands.updateBlock(props.block.id, {
      rows: rows.map((row) => [...row, ""]),
    });
  }

  function removeRow() {
    if (rows.length <= 1) return;
    props.commands.updateBlock(props.block.id, { rows: rows.slice(0, -1) });
  }

  function removeCol() {
    if (cols <= 1) return;
    props.commands.updateBlock(props.block.id, {
      rows: rows.map((row) => row.slice(0, -1)),
    });
  }

  return (
    <div className="nv-table" onFocus={props.onFocus}>
      <div className="nv-table-scroll">
        <table>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {Array.from({ length: cols }, (_, ci) => (
                  <td key={ci}>
                    <input
                      className="nv-table-cell"
                      value={row[ci] ?? ""}
                      readOnly={props.readOnly}
                      placeholder={ri === 0 ? "Header" : ""}
                      onChange={(e) => updateCell(ri, ci, e.target.value)}
                      onFocus={props.onFocus}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!props.readOnly && (
        <div className="nv-table-actions">
          <button type="button" onClick={addRow}>
            <Plus className="size-3" /> Row
          </button>
          <button type="button" onClick={addCol}>
            <Plus className="size-3" /> Col
          </button>
          <button type="button" onClick={removeRow}>
            <Trash2 className="size-3" /> Row
          </button>
          <button type="button" onClick={removeCol}>
            <Trash2 className="size-3" /> Col
          </button>
        </div>
      )}
    </div>
  );
}

export const VideoBlock = Extension({
  name: "video",
  types: ["video"],
  atom: true,
  slashCommands: [
    {
      id: "video",
      type: "video",
      label: "Video",
      description: "YouTube or Vimeo embed",
      icon: "▶",
      keywords: ["video", "youtube", "vimeo", "embed"],
      group: "Media",
    },
  ],
  render: (props) => {
    const embed = props.block.url ? youtubeEmbedUrl(props.block.url) : null;
    return (
      <div className="nv-video">
        {!props.readOnly && (
          <input
            className="nv-video-url"
            placeholder="Paste YouTube or Vimeo URL…"
            value={props.block.url ?? ""}
            onChange={(e) =>
              props.commands.updateBlock(props.block.id, { url: e.target.value })
            }
            onFocus={props.onFocus}
          />
        )}
        {embed ? (
          <div className="nv-video-frame">
            <iframe
              src={embed}
              title={props.block.label || "Video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="nv-video-empty">
            <Film className="size-5" />
            <span>Add a video URL to embed</span>
          </div>
        )}
      </div>
    );
  },
});

export const WebLink = Extension({
  name: "link",
  types: ["link"],
  atom: true,
  slashCommands: [
    {
      id: "link",
      type: "link",
      label: "Web link",
      description: "Bookmark / external URL card",
      icon: "🔗",
      keywords: ["link", "url", "bookmark", "web", "http"],
      group: "Media",
    },
  ],
  render: (props) => {
    const url = props.block.url ?? "";
    const title = props.block.label || props.block.text || "Link";
    let host = "";
    try {
      host = url ? new URL(url).hostname.replace(/^www\./, "") : "";
    } catch {
      host = "";
    }

    return (
      <div className="nv-weblink">
        {!props.readOnly && (
          <div className="nv-weblink-fields">
            <input
              className="nv-weblink-input"
              placeholder="https://"
              value={url}
              onChange={(e) =>
                props.commands.updateBlock(props.block.id, { url: e.target.value })
              }
              onFocus={props.onFocus}
            />
            <input
              className="nv-weblink-input"
              placeholder="Title"
              value={props.block.label ?? ""}
              onChange={(e) =>
                props.commands.updateBlock(props.block.id, {
                  label: e.target.value,
                  text: e.target.value,
                })
              }
              onFocus={props.onFocus}
            />
          </div>
        )}
        {url ? (
          <a
            className="nv-weblink-card"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="nv-weblink-icon">
              <Link2 className="size-4" />
            </span>
            <span className="nv-weblink-meta">
              <span className="nv-weblink-title">{title}</span>
              <span className="nv-weblink-host">{host}</span>
            </span>
            <ExternalLink className="size-3.5 text-muted" />
          </a>
        ) : (
          <div className="nv-weblink-empty">Paste a URL to create a bookmark</div>
        )}
      </div>
    );
  },
});
