"use client";

import { ListTree } from "lucide-react";
import { useMemo } from "react";
import type { Block } from "@/lib/blocks";

type Props = {
  blocks: Block[];
  onJump: (blockId: string) => void;
};

const HEADING_TYPES = new Set([
  "heading1",
  "heading2",
  "heading3",
  "heading4",
  "heading5",
  "heading6",
]);

export function TableOfContents({ blocks, onJump }: Props) {
  const items = useMemo(
    () =>
      blocks
        .filter((b) => HEADING_TYPES.has(b.type) && b.text.trim())
        .map((b) => ({
          id: b.id,
          text: b.text.trim(),
          level: Number(b.type.replace("heading", "")) || 1,
        })),
    [blocks],
  );

  if (items.length < 2) return null;

  return (
    <nav className="page-toc" aria-label="Table of contents">
      <div className="page-toc-head">
        <ListTree className="size-3.5" />
        <span>On this page</span>
      </div>
      <ul className="page-toc-list">
        {items.map((item) => (
          <li key={item.id} style={{ paddingLeft: `${(item.level - 1) * 0.65}rem` }}>
            <button
              type="button"
              className="page-toc-link"
              onClick={() => onJump(item.id)}
            >
              {item.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
