"use client";

import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEffect, useMemo } from "react";
import type { Note } from "@/domain/note";
import type { Folder, Workspace } from "@/domain/shelf";

type VaultNodeData = {
  label: string;
  kind: "workspace" | "folder" | "page";
  emoji?: string;
};

type VaultNode = Node<VaultNodeData, "vault">;

function VaultNodeView({ data }: NodeProps<VaultNode>) {
  const tone =
    data.kind === "workspace"
      ? "border-foreground/25 bg-foreground text-background"
      : data.kind === "folder"
        ? "border-border bg-card text-foreground"
        : "border-border/80 bg-muted/60 text-foreground";

  return (
    <div
      className={`min-w-[140px] max-w-[200px] rounded-[10px] border px-3 py-2 shadow-sm ${tone}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!size-2 !border-border !bg-muted-foreground/40"
      />
      <p className="font-mono text-[9px] tracking-[0.14em] uppercase opacity-60">
        {data.kind}
      </p>
      <p className="mt-0.5 truncate text-[13px] font-medium leading-tight">
        {data.emoji ? `${data.emoji} ` : null}
        {data.label}
      </p>
      <Handle
        type="source"
        position={Position.Right}
        className="!size-2 !border-border !bg-muted-foreground/40"
      />
    </div>
  );
}

const nodeTypes = { vault: VaultNodeView };

function buildGraph(
  workspaces: readonly Workspace[],
  folders: readonly Folder[],
  notes: readonly Note[],
  activeWorkspaceId: string,
): { nodes: VaultNode[]; edges: Edge[] } {
  const activeFolders = folders.filter(
    (folder) =>
      folder.workspaceId === activeWorkspaceId && folder.deletedAt == null,
  );
  const activeNotes = notes.filter(
    (note) => note.workspaceId === activeWorkspaceId && note.deletedAt == null,
  );
  const workspace = workspaces.find((item) => item.id === activeWorkspaceId);

  const nodes: VaultNode[] = [];
  const edges: Edge[] = [];

  if (!workspace) {
    return { nodes, edges };
  }

  const workspaceNodeId = `ws:${workspace.id}`;
  nodes.push({
    id: workspaceNodeId,
    type: "vault",
    position: { x: 40, y: 220 },
    data: {
      kind: "workspace",
      label: workspace.name,
      emoji: workspace.emoji,
    },
  });

  const folderYGap = 110;
  const folderStartY =
    40 + Math.max(0, ((activeFolders.length - 1) * folderYGap) / -2 + 180);

  activeFolders.forEach((folder, index) => {
    const folderNodeId = `folder:${folder.id}`;
    const folderY = folderStartY + index * folderYGap;
    nodes.push({
      id: folderNodeId,
      type: "vault",
      position: { x: 280, y: folderY },
      data: {
        kind: "folder",
        label: folder.name,
        emoji: folder.emoji,
      },
    });
    edges.push({
      id: `e-${workspaceNodeId}-${folderNodeId}`,
      source: workspaceNodeId,
      target: folderNodeId,
      type: "smoothstep",
      animated: true,
      style: { stroke: "var(--border)", strokeWidth: 1.5 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 14,
        height: 14,
        color: "var(--muted-foreground)",
      },
    });

    const folderNotes = activeNotes.filter(
      (note) => note.folderId === folder.id,
    );
    folderNotes.forEach((note, noteIndex) => {
      const pageNodeId = `page:${note.id}`;
      nodes.push({
        id: pageNodeId,
        type: "vault",
        position: {
          x: 520,
          y: folderY - ((folderNotes.length - 1) * 56) / 2 + noteIndex * 56,
        },
        data: {
          kind: "page",
          label: note.title || "Untitled",
        },
      });
      edges.push({
        id: `e-${folderNodeId}-${pageNodeId}`,
        source: folderNodeId,
        target: pageNodeId,
        type: "smoothstep",
        style: { stroke: "var(--muted-foreground)", strokeWidth: 1.25 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 12,
          height: 12,
          color: "var(--muted-foreground)",
        },
      });
    });
  });

  const rootNotes = activeNotes.filter((note) => note.folderId == null);
  rootNotes.forEach((note, index) => {
    const pageNodeId = `page:${note.id}`;
    nodes.push({
      id: pageNodeId,
      type: "vault",
      position: {
        x: 280,
        y: folderStartY + activeFolders.length * folderYGap + 40 + index * 64,
      },
      data: {
        kind: "page",
        label: note.title || "Untitled",
      },
    });
    edges.push({
      id: `e-${workspaceNodeId}-${pageNodeId}`,
      source: workspaceNodeId,
      target: pageNodeId,
      type: "smoothstep",
      style: { stroke: "var(--muted-foreground)", strokeWidth: 1.25 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 12,
        height: 12,
        color: "var(--muted-foreground)",
      },
    });
  });

  return { nodes, edges };
}

function VaultMapCanvas({
  workspaces,
  folders,
  notes,
  activeWorkspaceId,
  onOpenNote,
}: {
  workspaces: readonly Workspace[];
  folders: readonly Folder[];
  notes: readonly Note[];
  activeWorkspaceId: string;
  onOpenNote: (noteId: string) => void;
}) {
  const graph = useMemo(
    () => buildGraph(workspaces, folders, notes, activeWorkspaceId),
    [activeWorkspaceId, folders, notes, workspaces],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges);

  useEffect(() => {
    setNodes(graph.nodes);
    setEdges(graph.edges);
  }, [graph, setEdges, setNodes]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.35}
      maxZoom={1.6}
      proOptions={{ hideAttribution: true }}
      onNodeClick={(_, node) => {
        if (node.id.startsWith("page:")) {
          onOpenNote(node.id.slice("page:".length));
        }
      }}
      className="bg-transparent"
    >
      <Background gap={22} size={1} color="var(--border)" />
      <Controls
        showInteractive={false}
        className="!overflow-hidden !rounded-[8px] !border !border-border !bg-card !shadow-sm"
      />
      <MiniMap
        pannable
        zoomable
        className="!overflow-hidden !rounded-[8px] !border !border-border !bg-card/90"
        nodeColor={(node) => {
          const kind = (node.data as VaultNodeData | undefined)?.kind;
          if (kind === "workspace") return "var(--foreground)";
          if (kind === "folder") return "var(--accent)";
          return "var(--muted)";
        }}
      />
    </ReactFlow>
  );
}

export function VaultMap({
  workspaces,
  folders,
  notes,
  activeWorkspaceId,
  onOpenNote,
}: {
  workspaces: readonly Workspace[];
  folders: readonly Folder[];
  notes: readonly Note[];
  activeWorkspaceId: string;
  onOpenNote: (noteId: string) => void;
}) {
  const workspace =
    workspaces.find((item) => item.id === activeWorkspaceId) ?? workspaces[0];
  const activeCount =
    folders.filter(
      (folder) =>
        folder.workspaceId === activeWorkspaceId && folder.deletedAt == null,
    ).length +
    notes.filter(
      (note) =>
        note.workspaceId === activeWorkspaceId && note.deletedAt == null,
    ).length;

  return (
    <section className="relative flex min-h-full min-w-0 flex-1 flex-col overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 45% at 80% 0%, color-mix(in oklch, var(--accent) 35%, transparent), transparent 60%), linear-gradient(180deg, transparent, color-mix(in oklch, var(--muted) 40%, transparent))",
        }}
      />

      <header className="relative z-10 flex flex-wrap items-end justify-between gap-3 border-b border-border px-6 py-5 md:px-10">
        <div>
          <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
            Structure map
          </p>
          <h1 className="mt-1 font-display text-3xl tracking-tight text-foreground md:text-4xl">
            {workspace ? `${workspace.emoji} ${workspace.name}` : "Map"}
          </h1>
          <p className="mt-2 max-w-lg text-[14px] text-muted-foreground">
            How folders and pages connect inside this workspace. Click a page
            node to open it.
          </p>
        </div>
        <p className="font-mono text-[11px] text-muted-foreground">
          {activeCount} live node{activeCount === 1 ? "" : "s"}
        </p>
      </header>

      <div className="relative z-10 h-[min(70vh,640px)] min-h-[420px] w-full flex-1">
        <ReactFlowProvider>
          <VaultMapCanvas
            workspaces={workspaces}
            folders={folders}
            notes={notes}
            activeWorkspaceId={activeWorkspaceId}
            onOpenNote={onOpenNote}
          />
        </ReactFlowProvider>
      </div>
    </section>
  );
}
