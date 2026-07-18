"use client";

import { Bookmark } from "lucide-react";
import type { Block } from "@/lib/blocks";
import { stripInlineMarks } from "@/lib/inline-format";

type Props = {
  blocks: Block[];
  onJump: (blockId: string) => void;
};

export function PagePins({ blocks, onJump }: Props) {
  const pins = blocks.filter((b) => b.pinned && (b.text.trim() || b.label || b.type === "divider"));
  if (pins.length === 0) return null;

  return (
    <div className="page-pins" aria-label="Pinned blocks">
      <div className="page-pins-head">
        <Bookmark className="size-3.5" />
        <span>Bookmarks</span>
      </div>
      <ul className="page-pins-list">
        {pins.map((b) => (
          <li key={b.id}>
            <button type="button" className="page-pins-item" onClick={() => onJump(b.id)}>
              <span className="page-pins-type">{b.type}</span>
              <span className="page-pins-text">
                {stripInlineMarks(b.text.trim() || b.label || "Pinned block")}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
