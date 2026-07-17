"use client";

import { motion } from "motion/react";
import type { SlashCommand } from "@/lib/blocks";
import { dropdownVariants, easeOutSoft } from "@/lib/motion";

type Props = {
  commands: SlashCommand[];
  selectedIndex: number;
  onSelect: (command: SlashCommand) => void;
};

export function SlashMenu({ commands, selectedIndex, onSelect }: Props) {
  if (!commands.length) {
    return (
      <motion.div
        className="slash-menu"
        variants={dropdownVariants}
        initial="hidden"
        animate="visible"
        transition={easeOutSoft}
      >
        <p className="px-3 py-2 text-sm text-muted">No matching blocks</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="slash-menu"
      role="listbox"
      variants={dropdownVariants}
      initial="hidden"
      animate="visible"
      transition={easeOutSoft}
    >
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
    </motion.div>
  );
}
