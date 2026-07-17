"use client";

import { Highlighter, Paintbrush } from "lucide-react";
import { motion } from "motion/react";
import { HIGHLIGHT_COLORS, TEXT_COLORS } from "@/lib/colors";
import { easeOutSoft, dropdownVariants } from "@/lib/motion";

type Props = {
  color?: string;
  bgColor?: string;
  onColor: (color: string | undefined) => void;
  onBgColor: (bgColor: string | undefined) => void;
};

const COLORABLE = new Set([
  "paragraph",
  "heading1",
  "heading2",
  "heading3",
  "heading4",
  "heading5",
  "heading6",
  "bullet",
  "numbered",
  "todo",
  "quote",
  "callout",
  "custom",
  "toggle",
]);

export function canColorBlock(type: string) {
  return COLORABLE.has(type);
}

export function BlockToolbar({ color, bgColor, onColor, onBgColor }: Props) {
  const activeColor = color && color !== "default" ? color : "default";
  const activeBg = bgColor && bgColor !== "none" ? bgColor : "none";

  return (
    <motion.div
      className="nv-toolbar"
      role="toolbar"
      aria-label="Text style"
      variants={dropdownVariants}
      initial="hidden"
      animate="visible"
      transition={easeOutSoft}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="nv-toolbar-row">
        <span className="nv-toolbar-label">
          <Paintbrush className="size-3" />
          Text
        </span>
        <div className="nv-toolbar-swatches">
          {TEXT_COLORS.map((c) => {
            const isActive = activeColor === c.id;
            return (
              <button
                key={c.id}
                type="button"
                title={c.label}
                aria-label={`Text ${c.label}`}
                aria-pressed={isActive}
                className={`nv-toolbar-swatch ${isActive ? "nv-toolbar-swatch-active" : ""} ${
                  c.id === "default" ? "nv-toolbar-swatch-default" : ""
                }`}
                style={c.hex ? { background: c.hex } : undefined}
                onClick={() => onColor(c.id === "default" ? undefined : c.id)}
              >
                {c.id === "default" ? "A" : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="nv-toolbar-row">
        <span className="nv-toolbar-label">
          <Highlighter className="size-3" />
          Fill
        </span>
        <div className="nv-toolbar-swatches">
          {HIGHLIGHT_COLORS.map((c) => {
            const isActive = activeBg === c.id;
            return (
              <button
                key={c.id}
                type="button"
                title={c.label}
                aria-label={`Fill ${c.label}`}
                aria-pressed={isActive}
                className={`nv-toolbar-swatch nv-toolbar-swatch-fill ${
                  isActive ? "nv-toolbar-swatch-active" : ""
                } ${c.id === "none" ? "nv-toolbar-swatch-default" : ""}`}
                style={c.hex ? { background: c.hex } : undefined}
                onClick={() => onBgColor(c.id === "none" ? undefined : c.id)}
              >
                {c.id === "none" ? "∅" : null}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
