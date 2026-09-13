"use client";

import { FileText, Search } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Doc } from "../../../convex/_generated/dataModel";
import { useAnimeEnter } from "@/lib/anime-ui";

type Props = {
  pages: Doc<"notes">[];
  query: string;
  selectedIndex: number;
  onHoverIndex: (index: number) => void;
  onSelect: (page: Doc<"notes">) => void;
};

export function EditorMentionMenu({ pages, query, selectedIndex, onHoverIndex, onSelect }: Props) {
  const enterRef = useAnimeEnter<HTMLDivElement>("dropdown");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-mention-index="${selectedIndex}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  return (
    <div ref={enterRef} className="nv-mention-menu" role="listbox" aria-label="Link to page">
      <div className="nv-mention-head">
        <Search className="size-3.5 opacity-50" />
        <span>Link to page{query ? ` · ${query}` : ""}</span>
      </div>
      <div className="nv-mention-list note-scroll" ref={listRef}>
        {pages.length === 0 ? (
          <p className="nv-mention-empty">No matching pages</p>
        ) : (
          pages.map((page, index) => (
            <button
              key={page._id}
              type="button"
              role="option"
              aria-selected={index === selectedIndex}
              data-mention-index={index}
              className={`nv-mention-item ${index === selectedIndex ? "nv-mention-item-active" : ""}`}
              onMouseEnter={() => onHoverIndex(index)}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(page);
              }}
            >
              <span className="nv-mention-icon">
                {page.icon || <FileText className="size-3.5" />}
              </span>
              <span className="nv-mention-title truncate">{page.title || "Untitled"}</span>
            </button>
          ))
        )}
      </div>
      <p className="nv-mention-hint">↑↓ navigate · Enter link · Esc cancel</p>
    </div>
  );
}
