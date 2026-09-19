"use client";

import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Network, Search, X } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { AnimePresence } from "@/lib/anime-ui";
import { isFolder } from "@/lib/item-kinds";

type GraphEdgeKind = "link" | "parent";

type PageNodeData = {
  title: string;
  icon: string;
  noteId: string;
  onOpen: (id: string) => void;
};

type Props = {
  open: boolean;
  onClose: () => void;
  notes: Doc<"notes">[] | undefined;
  onNavigate: (id: Id<"notes">) => void;
};

function buildGraph(notes: Doc<"notes">[]) {
  const pages = notes.filter((n) => !isFolder(n) && !n.trashed && !n.archived);
  const ids = new Set(pages.map((p) => p._id as string));
  const edges: Array<{ from: string; to: string; kind: GraphEdgeKind }> = [];
  for (const page of pages) {
    for (const block of page.blocks ?? []) {
      if (block.type === "pagelink" && block.pageId && ids.has(block.pageId)) {
        edges.push({ from: page._id, to: block.pageId, kind: "link" });
      }
    }
    if (page.parentId && ids.has(page.parentId as string)) {
      edges.push({ from: page.parentId as string, to: page._id, kind: "parent" });
    }
  }
  return { pages, edges };
}

function layoutCircle(
  pages: Doc<"notes">[],
  onOpen: (id: string) => void,
): Node<PageNodeData>[] {
  const n = Math.max(pages.length, 1);
  const cx = 420;
  const cy = 300;
  const r = Math.min(280, 40 + n * 18);
  return pages.map((p, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    return {
      id: p._id,
      type: "page",
      position: {
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
      },
      data: {
        title: p.title || "Untitled",
        icon: p.icon || "📄",
        noteId: p._id,
        onOpen,
      },
      draggable: true,
    };
  });
}

const PageNode = memo(function PageNode({ data }: NodeProps<Node<PageNodeData>>) {
  return (
    <button
      type="button"
      className="nv-flow-node"
      onClick={() => data.onOpen(data.noteId)}
      title={data.title}
    >
      <Handle type="target" position={Position.Top} className="nv-flow-handle" />
      <span className="nv-flow-node-icon" aria-hidden>
        {data.icon.slice(0, 2)}
      </span>
      <span className="nv-flow-node-label">
        {data.title.length > 22 ? `${data.title.slice(0, 20)}…` : data.title}
      </span>
      <Handle type="source" position={Position.Bottom} className="nv-flow-handle" />
    </button>
  );
});

const nodeTypes = { page: PageNode };

function GraphCanvas({
  pages,
  edges,
  onOpen,
}: {
  pages: Doc<"notes">[];
  edges: Array<{ from: string; to: string; kind: GraphEdgeKind }>;
  onOpen: (id: string) => void;
}) {
  const initialNodes = useMemo(() => layoutCircle(pages, onOpen), [pages, onOpen]);
  const initialEdges = useMemo<Edge[]>(
    () =>
      edges.map((e, i) => ({
        id: `${e.kind}-${e.from}-${e.to}-${i}`,
        source: e.from,
        target: e.to,
        animated: e.kind === "link",
        className: e.kind === "link" ? "nv-flow-edge-link" : "nv-flow-edge-parent",
        style: {
          stroke: e.kind === "link" ? "var(--accent)" : "var(--muted)",
          strokeWidth: e.kind === "link" ? 2 : 1.5,
          strokeDasharray: e.kind === "parent" ? "5 4" : undefined,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
          color: e.kind === "link" ? "var(--accent)" : "var(--muted)",
        },
      })),
    [edges],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={flowEdges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.35}
      maxZoom={1.8}
      proOptions={{ hideAttribution: true }}
      className="nv-flow"
    >
      <Background gap={18} size={1} color="color-mix(in srgb, var(--ink) 12%, transparent)" />
      <Controls showInteractive={false} className="nv-flow-controls" />
      <MiniMap
        className="nv-flow-minimap"
        nodeColor="var(--accent)"
        maskColor="color-mix(in srgb, var(--paper) 70%, transparent)"
        pannable
        zoomable
      />
    </ReactFlow>
  );
}

export function GraphView({ open, onClose, notes, onNavigate }: Props) {
  const [query, setQuery] = useState("");
  const [showLinks, setShowLinks] = useState(true);
  const [showParents, setShowParents] = useState(true);

  const graph = useMemo(() => (notes ? buildGraph(notes) : null), [notes]);

  const filtered = useMemo(() => {
    if (!graph) return null;
    const q = query.trim().toLowerCase();
    let pages = graph.pages;
    if (q) {
      pages = pages.filter(
        (p) =>
          (p.title || "").toLowerCase().includes(q) ||
          (p.tags ?? []).some((t) => t.toLowerCase().includes(q)),
      );
    }
    const idSet = new Set(pages.map((p) => p._id as string));
    const edges = graph.edges.filter((e) => {
      if (!idSet.has(e.from) || !idSet.has(e.to)) return false;
      if (e.kind === "link" && !showLinks) return false;
      if (e.kind === "parent" && !showParents) return false;
      return true;
    });
    if (q) {
      const connected = new Set<string>();
      for (const e of edges) {
        connected.add(e.from);
        connected.add(e.to);
      }
      pages = pages.filter(
        (p) => connected.has(p._id) || (p.title || "").toLowerCase().includes(q),
      );
    }
    return { pages: pages.slice(0, 80), edges };
  }, [graph, query, showLinks, showParents]);

  const onOpen = useCallback(
    (id: string) => {
      onNavigate(id as Id<"notes">);
      onClose();
    },
    [onNavigate, onClose],
  );

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimePresence show={open} kind="overlay">
      <div className="graph-overlay">
        <button type="button" className="graph-backdrop" aria-label="Close" onClick={onClose} />
        <div className="graph-panel" role="dialog" aria-modal="true" aria-label="Page graph">
          <header className="graph-head">
            <div className="graph-title-row">
              <Network className="size-4 text-accent" />
              <h2 className="graph-title">
                Page <em>graph</em>
              </h2>
            </div>
            <button type="button" className="graph-close" aria-label="Close" onClick={onClose}>
              <X className="size-4" />
            </button>
          </header>
          <div className="graph-toolbar">
            <label className="graph-search">
              <Search className="size-3.5" aria-hidden />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter pages or tags…"
                aria-label="Filter graph"
              />
            </label>
            <div className="graph-filters">
              <label className="graph-filter">
                <input
                  type="checkbox"
                  checked={showLinks}
                  onChange={(e) => setShowLinks(e.target.checked)}
                />
                Wiki links
              </label>
              <label className="graph-filter">
                <input
                  type="checkbox"
                  checked={showParents}
                  onChange={(e) => setShowParents(e.target.checked)}
                />
                Hierarchy
              </label>
            </div>
          </div>
          <div className="graph-body nv-flow-body">
            {!filtered || filtered.pages.length === 0 ? (
              <p className="graph-empty">Link pages with [[mentions]] to see connections.</p>
            ) : (
              <ReactFlowProvider>
                <GraphCanvas pages={filtered.pages} edges={filtered.edges} onOpen={onOpen} />
              </ReactFlowProvider>
            )}
          </div>
        </div>
      </div>
    </AnimePresence>,
    document.body,
  );
}
