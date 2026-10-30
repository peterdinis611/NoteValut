"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "cn";

export type SlashCommandItem = {
  title: string;
  description: string;
  icon: LucideIcon;
  keywords?: string;
  group?: string;
  command: (props: {
    editor: import("@tiptap/react").Editor;
    range: import("@tiptap/core").Range;
  }) => void;
};

export type SlashCommandListRef = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
};

export const SlashCommandList = forwardRef<
  SlashCommandListRef,
  {
    items: SlashCommandItem[];
    command: (item: SlashCommandItem) => void;
  }
>(function SlashCommandList({ items, command }, ref) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  const sections = useMemo(() => {
    const map = new Map<string, SlashCommandItem[]>();
    for (const item of items) {
      const group = item.group ?? "Basic blocks";
      const list = map.get(group) ?? [];
      list.push(item);
      map.set(group, list);
    }
    return [...map.entries()];
  }, [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex(
          (index) => (index + items.length - 1) % Math.max(items.length, 1),
        );
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((index) => (index + 1) % Math.max(items.length, 1));
        return true;
      }
      if (event.key === "Enter") {
        const item = items[selectedIndex];
        if (item) command(item);
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div className="w-72 rounded-[10px] border border-border bg-popover p-3 text-[13px] text-muted-foreground shadow-lg">
        No results
      </div>
    );
  }

  let flatIndex = -1;

  return (
    <div className="w-72 overflow-hidden rounded-[10px] border border-border bg-popover p-1 shadow-lg ring-1 ring-foreground/5">
      <div className="max-h-80 overflow-y-auto">
        {sections.map(([group, groupItems]) => (
          <div key={group} className="pb-1">
            <p className="px-2 py-1.5 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
              {group}
            </p>
            {groupItems.map((item) => {
              flatIndex += 1;
              const index = flatIndex;
              const Icon = item.icon;
              return (
                <button
                  key={`${group}-${item.title}`}
                  type="button"
                  onClick={() => command(item)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-[7px] px-2 py-1.5 text-left transition-colors",
                    index === selectedIndex
                      ? "bg-accent text-accent-foreground"
                      : "text-popover-foreground hover:bg-muted",
                  )}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-[7px] border border-border bg-background text-muted-foreground">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium leading-tight">
                      {item.title}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {item.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
});
