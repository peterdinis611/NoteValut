"use client";

import { useQuery } from "convex/react";
import { Eye, FileText, FolderOpen, Lock } from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { VaultAccessProvider } from "@/context/vault-access";
import { isFolder } from "@/lib/item-kinds";
import { permissionLabel } from "@/lib/share";
import { NoteEditor } from "./note-editor";

type Props = {
  token: string;
};

export function SharedVaultApp({ token }: Props) {
  const bundle = useQuery(api.shares.getSharedVault, { token });
  const [activeId, setActiveId] = useState<Id<"notes"> | null>(null);

  const rootItems = useMemo(() => {
    if (!bundle?.notes) return [];
    const ids = new Set(bundle.notes.map((n) => n._id));
    return bundle.notes.filter((n) => !n.parentId || !ids.has(n.parentId));
  }, [bundle?.notes]);

  if (bundle === undefined) {
    return <div className="page-empty text-muted">Loading shared vault…</div>;
  }

  if (!bundle) {
    return (
      <div className="page-empty">
        <Lock className="size-10 text-muted" />
        <h2 className="text-lg font-medium">Link unavailable</h2>
        <p className="text-sm text-muted">This share link is invalid or has been revoked.</p>
      </div>
    );
  }

  const ownerId = bundle.ownerId;
  const readOnly = bundle.readOnly;

  return (
    <VaultAccessProvider
      value={{
        readOnly,
        shareToken: token,
        shareScope: bundle.share.scope,
        sharePermission: bundle.share.permission,
        isOwner: false,
      }}
    >
      <div className="app-shell">
        <aside className="sidebar shared-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-workspace">
              <span className="sidebar-workspace-icon">🔗</span>
              <span className="min-w-0 flex-1 truncate text-left text-sm font-medium">
                {bundle.share.label}
              </span>
            </div>
          </div>
          <div className="shared-badge">
            <Eye className="size-3.5" />
            {permissionLabel(bundle.share.permission)}
          </div>
          <nav className="sidebar-nav note-scroll">
            {bundle.share.scope === "vault" && (
              <button
                type="button"
                className={`sidebar-home ${activeId === null ? "sidebar-home-active" : ""}`}
                onClick={() => setActiveId(null)}
              >
                Vault overview
              </button>
            )}
            <div className="sidebar-section">
              <p className="sidebar-section-title">Contents</p>
              {rootItems.map((item) => (
                <SharedNavItem
                  key={item._id}
                  item={item}
                  activeId={activeId}
                  notes={bundle.notes}
                  onSelect={setActiveId}
                />
              ))}
            </div>
          </nav>
        </aside>
        <main className="app-main">
          {activeId ? (
            <NoteEditor
              noteId={activeId}
              ownerId={ownerId}
              onNavigate={setActiveId}
              onToggleSidebar={() => {}}
              sidebarCollapsed
              onCreateEntry={() => {}}
              onCreateCollection={() => {}}
            />
          ) : (
            <div className="vault-home note-scroll">
              <div className="vault-home-hero">
                <p className="vault-home-kicker">
                  <Eye className="mr-1 inline size-3.5" />
                  Shared vault
                </p>
                <h1 className="vault-home-title">{bundle.share.label}</h1>
                <p className="vault-home-subtitle">
                  {readOnly
                    ? "You have read-only access. Browse entries and collections below."
                    : "You can view and edit shared content."}
                </p>
              </div>
              <div className="vault-recent-grid">
                {bundle.notes
                  .filter((n) => n.kind !== "folder")
                  .slice(0, 8)
                  .map((entry) => (
                    <button
                      key={entry._id}
                      type="button"
                      className="vault-recent-card"
                      onClick={() => setActiveId(entry._id)}
                    >
                      <span className="vault-row-icon">{entry.icon}</span>
                      <span className="truncate font-medium">{entry.title || "Untitled"}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </VaultAccessProvider>
  );
}

function SharedNavItem({
  item,
  activeId,
  notes,
  onSelect,
  depth = 0,
}: {
  item: Doc<"notes">;
  activeId: Id<"notes"> | null;
  notes: Doc<"notes">[];
  onSelect: (id: Id<"notes">) => void;
  depth?: number;
}) {
  const children = notes.filter((n) => n.parentId === item._id);

  return (
    <>
      <button
        type="button"
        className={`sidebar-item-btn w-full ${activeId === item._id ? "sidebar-item-active" : ""}`}
        style={{ paddingLeft: 8 + depth * 12 }}
        onClick={() => onSelect(item._id)}
      >
        {isFolder(item) ? (
          <FolderOpen className="size-4 shrink-0 text-muted" />
        ) : (
          <FileText className="size-4 shrink-0 text-muted" />
        )}
        <span className="truncate">{item.title || "Untitled"}</span>
      </button>
      {children.map((child) => (
        <SharedNavItem
          key={child._id}
          item={child}
          activeId={activeId}
          notes={notes}
          onSelect={onSelect}
          depth={depth + 1}
        />
      ))}
    </>
  );
}
