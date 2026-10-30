"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { FileText, Link2, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { Note } from "@/domain/note";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "cn";

export function PageLinks({
  note,
  candidates,
  onLink,
  onUnlink,
  onOpen,
}: {
  note: Note;
  candidates: readonly Note[];
  onLink: (targetId: string) => void;
  onUnlink: (targetId: string) => void;
  onOpen: (noteId: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);

  const linked = useMemo(() => {
    const byId = new Map(candidates.map((item) => [item.id, item]));
    return (note.linkedNoteIds ?? [])
      .map((id) => byId.get(id))
      .filter((item): item is Note => item != null && item.deletedAt == null);
  }, [candidates, note.linkedNoteIds]);

  const available = useMemo(() => {
    const linkedSet = new Set(note.linkedNoteIds ?? []);
    return candidates.filter(
      (item) =>
        item.id !== note.id &&
        item.deletedAt == null &&
        item.workspaceId === note.workspaceId &&
        !linkedSet.has(item.id),
    );
  }, [candidates, note.id, note.linkedNoteIds, note.workspaceId]);

  return (
    <div className="mt-4 max-w-[44rem]">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-mono text-[10px] tracking-[0.14em] text-foreground/45 uppercase">
          Linked pages
        </p>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="rounded-full border-dashed"
              />
            }
          >
            <Plus className="size-3" />
            Link page
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-0">
            <Command>
              <CommandInput placeholder="Search pages…" />
              <CommandList>
                <CommandEmpty>No pages to link.</CommandEmpty>
                <CommandGroup heading="Same workspace">
                  {available.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={`${item.title} ${item.id}`}
                      onSelect={() => {
                        onLink(item.id);
                        setOpen(false);
                      }}
                    >
                      <FileText className="size-3.5 opacity-60" />
                      <span className="truncate">{item.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <ul className="mt-2 flex flex-wrap gap-2">
        <AnimatePresence initial={false} mode="popLayout">
          {linked.map((item, index) => (
            <motion.li
              key={item.id}
              layout={!reduceMotion}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.9, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={
                reduceMotion
                  ? undefined
                  : { opacity: 0, scale: 0.92, y: -4 }
              }
              transition={{
                duration: 0.22,
                delay: reduceMotion ? 0 : index * 0.04,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="group flex items-center gap-1 rounded-full border border-border bg-card/80 pl-1 pr-1 shadow-sm"
            >
              <button
                type="button"
                onClick={() => onOpen(item.id)}
                className={cn(
                  "inline-flex max-w-[14rem] items-center gap-1.5 rounded-full px-2 py-1 text-left text-[12px] text-foreground transition-colors",
                  "hover:bg-muted",
                )}
              >
                <Link2 className="size-3 shrink-0 text-foreground/45" />
                <span className="truncate font-medium">{item.title}</span>
              </button>
              <button
                type="button"
                aria-label={`Unlink ${item.title}`}
                onClick={() => onUnlink(item.id)}
                className="rounded-full p-1 text-foreground/40 opacity-70 transition-colors hover:bg-muted hover:text-foreground group-hover:opacity-100"
              >
                <X className="size-3" />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>

        {linked.length === 0 ? (
          <motion.li
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[12px] text-foreground/45"
          >
            Connect related notes — jump between them from here.
          </motion.li>
        ) : null}
      </ul>
    </div>
  );
}
