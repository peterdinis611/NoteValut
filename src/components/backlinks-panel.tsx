"use client";

import { useQuery } from "convex/react";
import { Link2, FileText } from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

type Props = {
  ownerId: string;
  noteId: Id<"notes">;
  onNavigate: (id: Id<"notes">) => void;
};

export function BacklinksPanel({ ownerId, noteId, onNavigate }: Props) {
  const links = useQuery(api.notes.listBacklinks, { ownerId, noteId });

  if (links === undefined) return null;
  if (links.length === 0) return null;

  return (
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
              <span className="page-backlinks-icon">{link.icon || <FileText className="size-3.5" />}</span>
              <span className="page-backlinks-title">{link.title || "Untitled"}</span>
              {link.count > 1 && (
                <span className="page-backlinks-count">{link.count}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
