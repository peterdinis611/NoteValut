"use client";

import type { SlashCommand } from "@/lib/blocks";
import { useAnimeEnter } from "@/lib/anime-ui";

type Props = {
  commands: SlashCommand[];
  selectedIndex: number;
  onSelect: (command: SlashCommand) => void;
};

export function SlashMenu({ commands, selectedIndex, onSelect }: Props) {
  const enterRef = useAnimeEnter<HTMLDivElement>("dropdown");

  if (!commands.length) {
    return (
      <div ref={enterRef} className="slash-menu">
        <p className="px-3 py-2 text-sm text-muted">No matching blocks</p>
      </div>
    );
  }

  return (
    <div ref={enterRef} className="slash-menu" role="listbox">
      <p className="slash-menu-label">Blocks</p>
      {commands.map((cmd, index) => (
        <button
          key={cmd.type}
          type="button"
          role="option"
          aria-selected={index === selectedIndex}
          className={`slash-menu-item ${index === selectedIndex ? "slash-menu-item-active" : ""}`}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(cmd);
          }}
        >
          <span className="slash-menu-icon">{cmd.icon}</span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block text-sm font-medium">{cmd.label}</span>
            <span className="block text-xs text-muted">{cmd.description}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
