"use client";

import { useEffect, useRef, useState } from "react";
import { PAGE_ICONS } from "@/lib/icons";

type Props = {
  value: string;
  onChange: (icon: string) => void;
  size?: "sm" | "lg";
};

export function IconPicker({ value, onChange, size = "lg" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

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
          <p className="icon-picker-label">Pick an icon</p>
          <div className="icon-picker-grid">
            {PAGE_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                className={`icon-picker-item ${value === icon ? "icon-picker-item-active" : ""}`}
                onClick={() => {
                  onChange(icon);
                  setOpen(false);
                }}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
