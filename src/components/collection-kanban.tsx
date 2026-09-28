"use client";

import { useMemo, useState } from "react";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { formatRelativeTime } from "@/lib/format";
import { isFolder } from "@/lib/item-kinds";
import { groupByProperty } from "@/lib/properties";
import { KANBAN_COLUMNS } from "@/lib/status";

type Props = {
  items: Doc<"notes">[];
  readOnly?: boolean;
  groupBy?: string;
  onNavigate: (id: Id<"notes">) => void;
  onUpdateStatus: (id: Id<"notes">, status: string | null) => void;
  onUpdateProperty?: (id: Id<"notes">, propertyId: string, value: string | null) => void;
};

export function CollectionKanban({
  items,
  readOnly,
  groupBy = "status",
  onNavigate,
  onUpdateStatus,
  onUpdateProperty,
}: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const columns = useMemo(() => {
    if (groupBy === "status") return KANBAN_COLUMNS.map((c) => ({ id: c.id, label: c.label }));
    const grouped = groupByProperty(
      items.filter((i) => !isFolder(i)),
      groupBy,
    );
    const keys = [...grouped.keys()].sort((a, b) => a.localeCompare(b));
    if (!keys.includes("")) keys.unshift("");
    return keys.map((k) => ({ id: k, label: k || "Empty" }));
  }, [items, groupBy]);

  const byCol = useMemo(() => {
    if (groupBy === "status") {
      const map = new Map<string, Doc<"notes">[]>();
      for (const col of KANBAN_COLUMNS) map.set(col.id, []);
      for (const item of items) {
        if (isFolder(item)) continue;
        const key =
          item.status && KANBAN_COLUMNS.some((c) => c.id === item.status) ? item.status : "";
        map.get(key)!.push(item);
      }
      return map;
    }
    return groupByProperty(
      items.filter((i) => !isFolder(i)),
      groupBy,
    );
  }, [items, groupBy]);

  return (
    <div className="kanban-board">
      {columns.map((col) => {
        const cards = byCol.get(col.id) ?? [];
        return (
          <section
            key={col.id || "none"}
            className="kanban-column"
            onDragOver={(e) => {
              if (readOnly) return;
              e.preventDefault();
            }}
            onDrop={(e) => {
              if (readOnly) return;
              e.preventDefault();
              const id = e.dataTransfer.getData("text/note-id") as Id<"notes">;
              if (!id) return;
              if (groupBy === "status") onUpdateStatus(id, col.id || null);
              else onUpdateProperty?.(id, groupBy, col.id || null);
              setDraggingId(null);
            }}
          >
            <header className="kanban-column-head">
              <h3>{col.label}</h3>
              <span>{cards.length}</span>
            </header>
            <ul className="kanban-cards">
              {cards.map((card) => (
                <li key={card._id}>
                  <button
                    type="button"
                    className={`kanban-card ${draggingId === card._id ? "is-dragging" : ""}`}
                    draggable={!readOnly}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/note-id", card._id);
                      setDraggingId(card._id);
                    }}
                    onDragEnd={() => setDraggingId(null)}
                    onClick={() => onNavigate(card._id)}
                  >
                    <span className="kanban-card-icon">{card.icon || "📝"}</span>
                    <span className="kanban-card-title">{card.title || "Untitled"}</span>
                    <span className="kanban-card-meta">{formatRelativeTime(card.updatedAt)}</span>
                    {(card.tags ?? []).length > 0 && (
                      <span className="kanban-card-tags">
                        {(card.tags ?? []).slice(0, 3).map((t) => (
                          <span key={t}>#{t}</span>
                        ))}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
