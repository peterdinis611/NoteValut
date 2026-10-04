"use client";

import { FileText, Search, User } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Doc } from "../../../convex/_generated/dataModel";
import { useAnimeEnter } from "@/lib/anime-ui";

export type MentionPerson = { id: string; name: string; source?: string };

type Props = {
  pages: Doc<"notes">[];
  people?: MentionPerson[];
  query: string;
  selectedIndex: number;
  onHoverIndex: (index: number) => void;
  onSelectPage: (page: Doc<"notes">) => void;
  onSelectPerson?: (person: MentionPerson) => void;
};

export function EditorMentionMenu({
  pages,
  people = [],
  query,
  selectedIndex,
  onHoverIndex,
  onSelectPage,
  onSelectPerson,
}: Props) {
  const enterRef = useAnimeEnter<HTMLDivElement>("dropdown");
  const listRef = useRef<HTMLDivElement>(null);

  const items: Array<
    | { kind: "page"; page: Doc<"notes"> }
    | { kind: "person"; person: MentionPerson }
  > = [
    ...people.map((person) => ({ kind: "person" as const, person })),
    ...pages.map((page) => ({ kind: "page" as const, page })),
  ];

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-mention-index="${selectedIndex}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  return (
    <div ref={enterRef} className="nv-mention-menu" role="listbox" aria-label="Mention">
      <div className="nv-mention-head">
        <Search className="size-3.5 opacity-50" />
        <span>
          @{query || "…"} · people & pages
        </span>
      </div>
      <div className="nv-mention-list note-scroll" ref={listRef}>
        {items.length === 0 ? (
          <p className="nv-mention-empty">No matches</p>
        ) : (
          items.map((item, index) =>
            item.kind === "person" ? (
              <button
                key={`p-${item.person.id}`}
                type="button"
                role="option"
                aria-selected={index === selectedIndex}
                data-mention-index={index}
                className={`nv-mention-item ${index === selectedIndex ? "nv-mention-item-active" : ""}`}
                onMouseEnter={() => onHoverIndex(index)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelectPerson?.(item.person);
                }}
              >
                <span className="nv-mention-icon">
                  <User className="size-3.5" />
                </span>
                <span className="nv-mention-title truncate">{item.person.name}</span>
                {item.person.source ? (
                  <span className="nv-mention-meta">{item.person.source}</span>
                ) : null}
              </button>
            ) : (
              <button
                key={item.page._id}
                type="button"
                role="option"
                aria-selected={index === selectedIndex}
                data-mention-index={index}
                className={`nv-mention-item ${index === selectedIndex ? "nv-mention-item-active" : ""}`}
                onMouseEnter={() => onHoverIndex(index)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelectPage(item.page);
                }}
              >
                <span className="nv-mention-icon">
                  {item.page.icon || <FileText className="size-3.5" />}
                </span>
                <span className="nv-mention-title truncate">
                  {item.page.title || "Untitled"}
                </span>
              </button>
            ),
          )
        )}
      </div>
      <p className="nv-mention-hint">↑↓ navigate · Enter select · Esc cancel</p>
    </div>
  );
}
