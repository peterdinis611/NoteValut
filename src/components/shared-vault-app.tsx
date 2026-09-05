"use client";

import { useQuery } from "convex/react";
import { Eye, FileText, FolderOpen, Lock, Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { VaultAccessProvider } from "@/context/vault-access";
import { isFolder } from "@/lib/item-kinds";
import { roleLabel } from "@/lib/ability";
import { ConnectionStatus } from "./connection-status";
import { LottieStatus } from "./lottie-status";
import { NoteEditor } from "./note-editor";
import { ScrollToTop } from "./scroll-to-top";

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
    return (
      <LottieStatus
        compact
        variant="loading"
        title="Opening shared vault…"
        description="Checking your share link and loading notes."
      />
    );
  }

  if (!bundle) {
    return (
      <LottieStatus
        variant="not-authorized"
        title="Not authorized"
        description="This share link is invalid, expired, or has been revoked. Ask the owner for a new invite."
        actions={[{ label: "Back to NoteVault", href: "/", primary: true }]}
      />
    );
  }

  const ownerId = bundle.ownerId;
  const role = bundle.role === "editor" ? "editor" : "viewer";
  const pages = bundle.notes.filter((n) => n.kind !== "folder");
  const collections = bundle.notes.filter((n) => n.kind === "folder");

  return (
    <VaultAccessProvider
      role={role}
      shareToken={token}
      shareScope={bundle.share.scope}
      sharePermission={bundle.share.permission}
      isOwner={false}
    >
      <div className="app-shell">
        <aside className="sidebar shared-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-workspace">
              <span className="sidebar-workspace-icon">🔗</span>
              <span className="sidebar-brand">{bundle.share.label}</span>
            </div>
          </div>
          <div className="shared-badge">
            {role === "editor" ? (
              <Pencil className="size-3.5" />
            ) : (
              <Eye className="size-3.5" />
            )}
            {roleLabel(role)}
          </div>
          <div className="shared-meta">
            <span>
              {pages.length} {pages.length === 1 ? "page" : "pages"}
            </span>
            <span>·</span>
            <span>
              {collections.length}{" "}
              {collections.length === 1 ? "collection" : "collections"}
            </span>
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
          <div className="shared-sidebar-footer">
            <ConnectionStatus variant="rail" />
          </div>
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
            <div className="vault-home note-scroll shared-preview">
              <div className="vault-home-hero nv-stagger">
                <p className="vault-home-kicker shared-preview-kicker">
                  <Lock className="size-3" />
                  Public share preview
                </p>
                <h1 className="vault-home-title">{bundle.share.label}</h1>
                <p className="vault-home-subtitle">
                  {role === "viewer"
                    ? "You have viewer access. Browse entries and collections — editing is locked."
                    : "You have editor access — you can view and edit shared content."}
                </p>
                <div className="shared-preview-chips">
                  <span className="shared-preview-chip">
                    {role === "editor" ? <Pencil className="size-3" /> : <Eye className="size-3" />}
                    {roleLabel(role)}
                  </span>
                  <span className="shared-preview-chip">
                    {bundle.share.scope === "vault" ? "Full vault" : "Scoped share"}
                  </span>
                  <span className="shared-preview-chip">
                    {pages.length} pages
                  </span>
                </div>
              </div>
              <p className="shared-preview-section">Recent entries</p>
              <div className="vault-recent-grid">
                {pages.slice(0, 12).map((entry) => (
                  <button
                    key={entry._id}
                    type="button"
                    className="vault-recent-card"
                    onClick={() => setActiveId(entry._id)}
                  >
                    <span className="vault-row-icon">{entry.icon}</span>
                    <span className="truncate font-medium">
                      {entry.title || "Untitled"}
                    </span>
                  </button>
                ))}
                {pages.length === 0 && (
                  <p className="shared-preview-empty">No pages in this share yet.</p>
                )}
              </div>
            </div>
          )}
          <ScrollToTop resetKey={activeId} />
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
