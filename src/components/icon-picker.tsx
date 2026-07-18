"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PAGE_ICON_GROUPS } from "@/lib/icons";
import { searchIconsFlat } from "@/lib/search";

type Props = {
  value: string;
  onChange: (icon: string) => void;
  size?: "sm" | "lg";
};

const COLS = 8;
const CELL = 36;

export function IconPicker({ value, onChange, size = "lg" }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [groupId, setGroupId] = useState<string>("all");
  const [debouncedQuery] = useDebouncedValue(query, { wait: 160 });
  const ref = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setGroupId("all");
    }
  }, [open]);

  const icons = useMemo(() => {
    const hits = searchIconsFlat(debouncedQuery);
    if (groupId === "all") return hits;
    return hits.filter((h) => h.groupId === groupId);
  }, [debouncedQuery, groupId]);

  const rowCount = Math.ceil(icons.length / COLS) || 0;

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => CELL,
    overscan: 4,
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [groupId, debouncedQuery]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className={size === "lg" ? "page-icon-btn" : "page-icon-btn-sm"}
        onClick={() => setOpen((v) => !v)}
        aria-label="Change page icon"
      >
        {value}
      </button>

      {open && (
        <div className="icon-picker-popover">
          <p className="icon-picker-label">Icon gallery</p>
          <div className="icon-picker-search">
            <Search className="size-3.5 text-muted" />
            <input
              autoFocus
              className="icon-picker-search-input"
              placeholder="Search icons…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="icon-picker-groups" role="tablist" aria-label="Icon groups">
            <button
              type="button"
              role="tab"
              aria-selected={groupId === "all"}
              className={`icon-picker-group-chip ${groupId === "all" ? "is-active" : ""}`}
              onClick={() => setGroupId("all")}
            >
              All
            </button>
            {PAGE_ICON_GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                role="tab"
                aria-selected={groupId === g.id}
                className={`icon-picker-group-chip ${groupId === g.id ? "is-active" : ""}`}
                onClick={() => setGroupId(g.id)}
              >
                {g.label}
              </button>
            ))}
          </div>
          <div ref={scrollRef} className="icon-picker-scroll icon-picker-virtual">
            {icons.length === 0 ? (
              <p className="icon-picker-empty">No matches</p>
            ) : (
              <div
                className="icon-picker-virtual-inner"
                style={{ height: virtualizer.getTotalSize() }}
              >
                {virtualizer.getVirtualItems().map((row) => {
                  const start = row.index * COLS;
                  const slice = icons.slice(start, start + COLS);
                  return (
                    <div
                      key={row.key}
                      data-index={row.index}
                      ref={virtualizer.measureElement}
                      className="icon-picker-virtual-row"
                      style={{ transform: `translateY(${row.start}px)` }}
                    >
                      {slice.map((item) => (
                        <button
                          key={`${item.groupId}-${item.icon}`}
                          type="button"
                          className={`icon-picker-item ${
                            value === item.icon ? "icon-picker-item-active" : ""
                          }`}
                          title={item.groupLabel}
                          onClick={() => {
                            onChange(item.icon);
                            setOpen(false);
                          }}
                        >
                          {item.icon}
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
