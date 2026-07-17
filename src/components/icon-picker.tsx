"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { filterIcons } from "@/lib/icons";

type Props = {
  value: string;
  onChange: (icon: string) => void;
  size?: "sm" | "lg";
};

export function IconPicker({ value, onChange, size = "lg" }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const groups = useMemo(() => filterIcons(query), [query]);

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
          <p className="icon-picker-label">Emoji</p>
          <div className="icon-picker-search">
            <Search className="size-3.5 text-muted" />
            <input
              autoFocus
              className="icon-picker-search-input"
              placeholder="Search groups…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="icon-picker-scroll">
            {groups.length === 0 ? (
              <p className="icon-picker-empty">No matches</p>
            ) : (
              groups.map((group) => (
                <section key={group.id} className="icon-picker-group">
                  <p className="icon-picker-group-label">{group.label}</p>
                  <div className="icon-picker-grid">
                    {group.icons.map((icon) => (
                      <button
                        key={`${group.id}-${icon}`}
                        type="button"
                        className={`icon-picker-item ${
                          value === icon ? "icon-picker-item-active" : ""
                        }`}
                        onClick={() => {
                          onChange(icon);
                          setOpen(false);
                        }}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
