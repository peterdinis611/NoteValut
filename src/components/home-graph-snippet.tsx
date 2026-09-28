"use client";

import { useMemo } from "react";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { isFolder } from "@/lib/item-kinds";

type Props = {
  notes: Doc<"notes">[] | undefined;
  onNavigate: (id: Id<"notes">) => void;
  onOpenFull?: () => void;
};

/** Lightweight SVG graph snippet for vault home (no React Flow). */
export function HomeGraphSnippet({ notes, onNavigate, onOpenFull }: Props) {
  const { nodes, links } = useMemo(() => {
    const pages = (notes ?? [])
      .filter((n) => !isFolder(n) && !n.trashed && !n.archived)
      .slice(0, 18);
    const ids = new Set(pages.map((p) => p._id as string));
    const edgePairs: Array<[string, string]> = [];
    for (const page of pages) {
      for (const b of page.blocks ?? []) {
        if (b.type === "pagelink" && b.pageId && ids.has(b.pageId)) {
          edgePairs.push([page._id, b.pageId]);
        }
      }
    }
    const n = Math.max(pages.length, 1);
    const cx = 140;
    const cy = 78;
    const r = Math.min(58, 28 + n * 2.2);
    const nodes = pages.map((p, i) => {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      return {
        id: p._id as string,
        title: p.title || "Untitled",
        icon: p.icon || "📄",
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
      };
    });
    return { nodes, links: edgePairs.slice(0, 40) };
  }, [notes]);

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  if (nodes.length === 0) {
    return (
      <div className="home-graph-empty">
        <p>Link pages with [[mentions]] to grow the graph.</p>
        {onOpenFull && (
          <button type="button" className="vault-section-link" onClick={onOpenFull}>
            Open graph
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="home-graph-snippet">
      <svg viewBox="0 0 280 156" className="home-graph-svg" aria-hidden>
        {links.map(([from, to], i) => {
          const a = byId.get(from);
          const b = byId.get(to);
          if (!a || !b) return null;
          return (
            <line
              key={`${from}-${to}-${i}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              className="home-graph-edge"
            />
          );
        })}
        {nodes.map((n) => (
          <g key={n.id} className="home-graph-node">
            <circle cx={n.x} cy={n.y} r={10} />
            <text x={n.x} y={n.y + 1} textAnchor="middle" dominantBaseline="middle">
              {n.icon.slice(0, 2)}
            </text>
          </g>
        ))}
      </svg>
      <ul className="home-graph-legend">
        {nodes.slice(0, 5).map((n) => (
          <li key={n.id}>
            <button type="button" onClick={() => onNavigate(n.id as Id<"notes">)}>
              <span>{n.icon}</span>
              <span className="truncate">{n.title}</span>
            </button>
          </li>
        ))}
      </ul>
      {onOpenFull && (
        <button type="button" className="home-graph-open" onClick={onOpenFull}>
          Expand graph
        </button>
      )}
    </div>
  );
}
