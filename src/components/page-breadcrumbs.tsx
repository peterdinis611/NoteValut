"use client";

import { useQuery } from "convex/react";
import { ChevronRight } from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

type Props = {
  noteId: Id<"notes">;
  onNavigate: (id: Id<"notes">) => void;
  compact?: boolean;
};

export function PageBreadcrumbs({ noteId, onNavigate, compact }: Props) {
  const crumbs = useQuery(api.notes.getBreadcrumbs, { id: noteId });

  if (!crumbs?.length) return null;

  if (compact) {
    const last = crumbs[crumbs.length - 1];
    return (
      <nav aria-label="Breadcrumb" className="topbar-breadcrumb">
        {crumbs.length > 1 &&
          crumbs.slice(0, -1).map((crumb) => (
            <span key={crumb.id} className="flex items-center gap-1">
              <button type="button" className="topbar-crumb" onClick={() => onNavigate(crumb.id)}>
                {crumb.title || "Untitled"}
              </button>
              <ChevronRight className="size-3 text-muted/50" />
            </span>
          ))}
        <span className="topbar-crumb-current truncate">
          {last.icon} {last.title || "Untitled"}
        </span>
      </nav>
    );
  }

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-1 text-sm text-muted">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <span key={crumb.id} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="size-3 opacity-50" />}
            {isLast ? (
              <span className="text-foreground">{crumb.title || "Untitled"}</span>
            ) : (
              <button
                type="button"
                className="rounded px-1 py-0.5 transition hover:bg-hover hover:text-foreground"
                onClick={() => onNavigate(crumb.id)}
              >
                {crumb.title || "Untitled"}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
