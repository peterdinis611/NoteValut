"use client";

import { Network, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { isFolder } from "@/lib/item-kinds";
import { easeOutSoft, modalVariants, overlayVariants } from "@/lib/motion";

type Node = {
  id: string;
  title: string;
  icon: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

type Edge = { from: string; to: string };

type Props = {
  open: boolean;
  onClose: () => void;
  notes: Doc<"notes">[] | undefined;
  onNavigate: (id: Id<"notes">) => void;
};

function buildGraph(notes: Doc<"notes">[]) {
  const pages = notes.filter((n) => !isFolder(n) && !n.trashed && !n.archived);
  const ids = new Set(pages.map((p) => p._id as string));
  const edges: Edge[] = [];
  for (const page of pages) {
    for (const block of page.blocks ?? []) {
      if (block.type === "pagelink" && block.pageId && ids.has(block.pageId)) {
        edges.push({ from: page._id, to: block.pageId });
      }
    }
    if (page.parentId && ids.has(page.parentId as string)) {
      edges.push({ from: page.parentId as string, to: page._id });
    }
  }
  return { pages, edges };
}

export function GraphView({ open, onClose, notes, onNavigate }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 800, h: 560 });
  const graph = useMemo(() => (notes ? buildGraph(notes) : null), [notes]);

  const [nodes, setNodes] = useState<Node[]>([]);

  useEffect(() => {
    if (!open || !graph) return;
    const { pages } = graph;
    const w = size.w;
    const h = size.h;
    setNodes(
      pages.slice(0, 80).map((p, i) => {
        const angle = (i / Math.max(pages.length, 1)) * Math.PI * 2;
        const r = Math.min(w, h) * 0.28;
        return {
          id: p._id,
          title: p.title || "Untitled",
          icon: p.icon || "📄",
          x: w / 2 + Math.cos(angle) * r,
          y: h / 2 + Math.sin(angle) * r,
          vx: 0,
          vy: 0,
        };
      }),
    );
  }, [open, graph, size.w, size.h]);

  useEffect(() => {
    if (!open || !graph || nodes.length === 0) return;
    let frame = 0;
    let alive = true;
    const idSet = new Set(nodes.map((n) => n.id));
    const edges = graph.edges.filter((e) => idSet.has(e.from) && idSet.has(e.to));

    function tick() {
      if (!alive) return;
      setNodes((prev) => {
        const next = prev.map((n) => ({ ...n }));
        const byId = new Map(next.map((n) => [n.id, n]));
        const cx = size.w / 2;
        const cy = size.h / 2;

        for (let i = 0; i < next.length; i++) {
          for (let j = i + 1; j < next.length; j++) {
            const a = next[i];
            const b = next[j];
            let dx = a.x - b.x;
            let dy = a.y - b.y;
            let dist = Math.hypot(dx, dy) || 1;
            const force = 900 / (dist * dist);
            dx = (dx / dist) * force;
            dy = (dy / dist) * force;
            a.vx += dx;
            a.vy += dy;
            b.vx -= dx;
            b.vy -= dy;
          }
        }

        for (const e of edges) {
          const a = byId.get(e.from);
          const b = byId.get(e.to);
          if (!a || !b) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 1;
          const force = (dist - 120) * 0.02;
          a.vx += (dx / dist) * force;
          a.vy += (dy / dist) * force;
          b.vx -= (dx / dist) * force;
          b.vy -= (dy / dist) * force;
        }

        for (const n of next) {
          n.vx += (cx - n.x) * 0.004;
          n.vy += (cy - n.y) * 0.004;
          n.vx *= 0.85;
          n.vy *= 0.85;
          n.x = Math.max(40, Math.min(size.w - 40, n.x + n.vx));
          n.y = Math.max(40, Math.min(size.h - 40, n.y + n.vy));
        }
        return next;
      });
      frame += 1;
      if (frame < 180) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    return () => {
      alive = false;
    };
  }, [open, graph, nodes.length, size.w, size.h]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !svgRef.current) return;
    const el = svgRef.current.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: Math.max(420, el.clientHeight) });
    });
    ro.observe(el);
    setSize({ w: el.clientWidth, h: Math.max(420, el.clientHeight) });
    return () => ro.disconnect();
  }, [open]);

  if (typeof document === "undefined") return null;

  const edgePairs =
    graph && nodes.length
      ? graph.edges.filter((e) => {
          const ids = new Set(nodes.map((n) => n.id));
          return ids.has(e.from) && ids.has(e.to);
        })
      : [];
  const byId = new Map(nodes.map((n) => [n.id, n]));

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="graph-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <button type="button" className="graph-backdrop" aria-label="Close" onClick={onClose} />
          <motion.div
            className="graph-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Page graph"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={easeOutSoft}
          >
            <header className="graph-head">
              <div className="graph-title-row">
                <Network className="size-4 text-accent" />
                <h2 className="graph-title">Page graph</h2>
              </div>
              <button type="button" className="graph-close" aria-label="Close" onClick={onClose}>
                <X className="size-4" />
              </button>
            </header>
            <div className="graph-body">
              {!graph || nodes.length === 0 ? (
                <p className="graph-empty">Link pages with [[mentions]] to see connections.</p>
              ) : (
                <svg ref={svgRef} className="graph-svg" width={size.w} height={size.h}>
                  {edgePairs.map((e, i) => {
                    const a = byId.get(e.from);
                    const b = byId.get(e.to);
                    if (!a || !b) return null;
                    return (
                      <line
                        key={`${e.from}-${e.to}-${i}`}
                        x1={a.x}
                        y1={a.y}
                        x2={b.x}
                        y2={b.y}
                        className="graph-edge"
                      />
                    );
                  })}
                  {nodes.map((n) => (
                    <g
                      key={n.id}
                      className="graph-node"
                      transform={`translate(${n.x}, ${n.y})`}
                      onClick={() => {
                        onNavigate(n.id as Id<"notes">);
                        onClose();
                      }}
                    >
                      <circle r={18} className="graph-node-circle" />
                      <text textAnchor="middle" dy="0.35em" className="graph-node-icon">
                        {n.icon.slice(0, 2)}
                      </text>
                      <text textAnchor="middle" y={30} className="graph-node-label">
                        {n.title.length > 18 ? `${n.title.slice(0, 16)}…` : n.title}
                      </text>
                    </g>
                  ))}
                </svg>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
