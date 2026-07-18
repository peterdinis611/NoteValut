"use client";

import {
  AlertTriangle,
  Bookmark,
  Boxes,
  CheckSquare,
  ChevronsUpDown,
  Code2,
  Film,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  ImageIcon,
  Info,
  FileText,
  Lightbulb,
  Link2,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Sparkles,
  Table2,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { dropdownVariants, easeOutSoft } from "@/lib/motion";
import type { SlashCommandDef } from "../types";

const ICONS: Record<string, LucideIcon> = {
  paragraph: Pilcrow,
  heading1: Heading1,
  heading2: Heading2,
  heading3: Heading3,
  heading4: Heading4,
  heading5: Heading5,
  heading6: Heading6,
  bullet: List,
  numbered: ListOrdered,
  todo: CheckSquare,
  quote: Quote,
  code: Code2,
  "callout-info": Info,
  "callout-tip": Lightbulb,
  "callout-warning": AlertTriangle,
  pagelink: Link2,
  toggle: ChevronsUpDown,
  image: ImageIcon,
  table: Table2,
  video: Film,
  pdf: FileText,
  link: Bookmark,
  divider: Minus,
  custom: Boxes,
};

type Props = {
  commands: SlashCommandDef[];
  selectedIndex: number;
  query?: string;
  onSelect: (command: SlashCommandDef) => void;
  onHoverIndex?: (index: number) => void;
};

export function EditorSlashMenu({
  commands,
  selectedIndex,
  query = "",
  onSelect,
  onHoverIndex,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const active = listRef.current?.querySelector<HTMLElement>("[aria-selected='true']");
    active?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex, commands]);

  const groups = groupCommands(commands);

  return (
    <motion.div
      className="nv-slash"
      role="listbox"
      variants={dropdownVariants}
      initial="hidden"
      animate="visible"
      transition={easeOutSoft}
    >
      <header className="nv-slash-head">
        <div className="nv-slash-head-left">
          <span className="nv-slash-brand">Insert</span>
          {query ? (
            <span className="nv-slash-query-pill">/{query}</span>
          ) : (
            <span className="nv-slash-hint-inline">keep typing to filter</span>
          )}
        </div>
        <span className="nv-slash-kbd">↑↓ ↵</span>
      </header>

      <div className="nv-slash-body" ref={listRef}>
        {!commands.length ? (
          <div className="nv-slash-empty">
            <Sparkles className="size-4 opacity-70" />
            <p>Nothing matches “{query}”</p>
            <p className="nv-slash-empty-hint">Try code, task, image, or custom</p>
          </div>
        ) : (
          groups.map(([group, items]) => (
            <section key={group} className="nv-slash-group">
              <p className="nv-slash-group-label">{group}</p>
              <div className="nv-slash-stack">
                {items.map((cmd) => {
                  const globalIndex = commands.indexOf(cmd);
                  const Icon = cmd.id.startsWith("custom-")
                    ? Boxes
                    : (ICONS[cmd.id] ?? Boxes);
                  const active = globalIndex === selectedIndex;
                  return (
                    <button
                      key={cmd.id}
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={`nv-slash-item ${active ? "nv-slash-item-active" : ""}`}
                      onMouseEnter={() => onHoverIndex?.(globalIndex)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onSelect(cmd);
                      }}
                    >
                      <span className={`nv-slash-icon nv-slash-tone-${toneFor(cmd.group)}`}>
                        <Icon className="size-4" strokeWidth={1.75} />
                      </span>
                      <span className="nv-slash-text">
                        <span className="nv-slash-title">{cmd.label}</span>
                        <span className="nv-slash-desc">{cmd.description}</span>
                      </span>
                      {active && <span className="nv-slash-enter">↵</span>}
                    </button>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>

      <footer className="nv-slash-foot">
        <span>Esc closes</span>
        <span>Custom blocks live under Yours</span>
      </footer>
    </motion.div>
  );
}

function toneFor(group?: string) {
  switch (group) {
    case "Headings":
      return "headings";
    case "Lists":
      return "lists";
    case "Callouts":
      return "callouts";
    case "Media":
      return "media";
    case "Yours":
      return "yours";
    default:
      return "basic";
  }
}

function groupCommands(commands: SlashCommandDef[]) {
  const order = ["Yours", "Basic", "Headings", "Lists", "Callouts", "Media"];
  const map = new Map<string, SlashCommandDef[]>();
  for (const cmd of commands) {
    const group = cmd.group ?? "Basic";
    if (!map.has(group)) map.set(group, []);
    map.get(group)!.push(cmd);
  }
  return [...map.entries()].sort((a, b) => {
    const ai = order.indexOf(a[0]);
    const bi = order.indexOf(b[0]);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}
