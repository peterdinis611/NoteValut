"use client";

import { useMutation, useQuery } from "convex/react";
import { FileText, Link2, Unlink } from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useToast } from "@/components/toast";

type Props = {
  ownerId: string;
  noteId: Id<"notes">;
  onNavigate: (id: Id<"notes">) => void;
};

export function BacklinksPanel({ ownerId, noteId, onNavigate }: Props) {
  const links = useQuery(api.notes.listBacklinks, { ownerId, noteId });
  const unlinked = useQuery(api.notes.listUnlinkedMentions, { ownerId, noteId });
  const appendPagelink = useMutation(api.notes.appendPagelink);
  const toast = useToast();

  const hasLinks = links !== undefined && links.length > 0;
  const hasUnlinked = unlinked !== undefined && unlinked.length > 0;

  if (links === undefined && unlinked === undefined) return null;
  if (!hasLinks && !hasUnlinked) return null;

  const linkMention = async (fromNoteId: Id<"notes">, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await appendPagelink({ ownerId, fromNoteId, toNoteId: noteId });
      toast.success("Linked page");
    } catch {
      toast.error("Couldn’t create link");
    }
  };

  return (
    <>
      {hasLinks && (
        <section className="page-backlinks" aria-label="Backlinks">
          <div className="page-backlinks-head">
            <Link2 className="size-3.5" />
            <span>
              {links.length} linked {links.length === 1 ? "page" : "pages"}
            </span>
          </div>
          <ul className="page-backlinks-list">
            {links.map((link) => (
              <li key={link._id}>
                <button
                  type="button"
                  className="page-backlinks-item"
                  onClick={() => onNavigate(link._id)}
                >
                  <span className="page-backlinks-icon">
                    {link.icon || <FileText className="size-3.5" />}
                  </span>
                  <span className="page-backlinks-title">{link.title || "Untitled"}</span>
                  {link.count > 1 && (
                    <span className="page-backlinks-count">{link.count}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasUnlinked && (
        <section className="page-backlinks page-unlinked" aria-label="Unlinked mentions">
          <div className="page-backlinks-head">
            <Unlink className="size-3.5" />
            <span>
              {unlinked.length} unlinked {unlinked.length === 1 ? "mention" : "mentions"}
            </span>
          </div>
          <ul className="page-backlinks-list">
            {unlinked.map((hit) => (
              <li key={hit._id} className="page-unlinked-row">
                <button
                  type="button"
                  className="page-backlinks-item page-unlinked-item"
                  onClick={() => onNavigate(hit._id)}
                >
                  <span className="page-backlinks-icon">
                    {hit.icon || <FileText className="size-3.5" />}
                  </span>
                  <span className="page-unlinked-main">
                    <span className="page-backlinks-title">{hit.title || "Untitled"}</span>
                    {hit.snippet && (
                      <span className="page-unlinked-snippet">…{hit.snippet}…</span>
                    )}
                  </span>
                </button>
                <button
                  type="button"
                  className="page-unlinked-link-btn"
                  onClick={(e) => void linkMention(hit._id, e)}
                >
                  Link
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
